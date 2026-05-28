#import <Capacitor/Capacitor.h>

CAP_PLUGIN(MediaControlsPlugin, "MediaControls",
           CAP_PLUGIN_METHOD(updateNowPlaying, CAPPluginMethodReturnPromise);
)
