import Foundation
import Capacitor
import MediaPlayer

@objc(MediaControlsPlugin)
public class MediaControlsPlugin: CAPPlugin, CAPBridge {
    private var isRegistered = false

    @objc func updateNowPlaying(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? ""
        let artist = call.getString("artist") ?? ""
        let duration = call.getDouble("duration") ?? 0
        let currentTime = call.getDouble("currentTime") ?? 0
        let artworkUrl = call.getString("artwork") ?? ""

        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 1.0

        if !artworkUrl.isEmpty {
            if let url = URL(string: artworkUrl), let data = try? Data(contentsOf: url), let image = UIImage(data: data) {
                let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
            }
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

        if !isRegistered {
            setupRemoteCommands()
            isRegistered = true
        }

        call.resolve()
    }

    private func setupRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.addTarget { [weak self] event in
            self?.notifyListeners("remoteCommand", data: ["command": "play"])
            return .success
        }

        commandCenter.pauseCommand.addTarget { [weak self] event in
            self?.notifyListeners("remoteCommand", data: ["command": "pause"])
            return .success
        }

        commandCenter.nextTrackCommand.addTarget { [weak self] event in
            self?.notifyListeners("remoteCommand", data: ["command": "next"])
            return .success
        }

        commandCenter.previousTrackCommand.addTarget { [weak self] event in
            self?.notifyListeners("remoteCommand", data: ["command": "prev"])
            return .success
        }
    }
}
