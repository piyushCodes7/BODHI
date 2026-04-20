#import "AppDelegate.h"
#import <Expo/Expo.h> // Keep this
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"BODHI";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// ─── ADD THIS METHOD TO INITIALIZE EXPO MODULES ───
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  // This allows Expo modules (like expo-av) to talk to the React Native bridge
  return [[EXModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[EXModuleRegistryProvider alloc] init]].extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  // If you are using Expo modules in a bare project, sometimes this needs to be "index" 
  // depending on your entry point. If it fails, try changing it back to ".expo/.virtual-metro-entry"
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end