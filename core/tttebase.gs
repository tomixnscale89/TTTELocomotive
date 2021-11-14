include "gs.gs"
include "tttehelpers.gs"
include "tttemenu.gs"
include "tttelib.gs"
include "vehicle.gs"
include "stringtable.gs"

class TTTEBase isclass TTTEHelpers
{
  public Vehicle self;

  tttelib TTTELocoLibrary;
  TTTEOnline onlineLibrary;

  Asset ScriptAsset = null;
  public StringTable strTable = null; // This asset's string table, saved for convenient fast access

  //Config data
  Soup myConfig;
  Soup ExtensionsContainer;


  public bool useLockTarget = false;
  public bool selectingTarget = false;
  public MapObject eyeLockTarget;

  //Supported features
  int SupportedFeatureset = 0;
  int SupportedHeadcode = 0;

  define int FEATURE_EYES         = 1;
  define int FEATURE_LAMPS        = 1 << 1;
  define int FEATURE_LIVERIES     = 1 << 2;
  define int FEATURE_FACES        = 1 << 3;
  define int FEATURE_SMOKE        = 1 << 4;
  define int FEATURE_BUFFERS      = 1 << 5;

  public Browser popup;

  CustomScriptMenu CurrentMenu = null;

  CustomScriptMenu EyescriptMenu  = null;
  CustomScriptMenu JoystickMenu   = null;
  CustomScriptMenu LampMenu       = null;
  CustomScriptMenu LiveryMenu     = null;
  CustomScriptMenu FaceMenu       = null;
  CustomScriptMenu LocoMenu       = null;
  CustomScriptMenu SmokeMenu      = null;
  CustomScriptMenu SocialMenu     = null;

  //public define int BROWSER_NONE         = -1;
  // public define int BROWSER_EYEMENU      = 1;
  // public define int BROWSER_JOYSTICKMENU = 2;
  // public define int BROWSER_LAMPMENU     = 3;
  // public define int BROWSER_LIVERYMENU   = 4;
  // public define int BROWSER_FACEMENU     = 5;
  // public define int BROWSER_LOCOMENU     = 6;
  // public define int BROWSER_SMOKEMENU    = 7;
  // public define int BROWSER_SOCIALMENU   = 8;
  // public define int BROWSER_CUSTOMMENU_0 = 9;

  CustomScriptMenu[] customMenus = new CustomScriptMenu[0];

  //Functions
  Soup GetTTTELocomotiveSettings();
  TTTEOnline GetOnlineLibrary();

  public CustomScriptMenu[] GetCustomMenus();

  public void RefreshBrowser()
  {
  }

  void SetFeatureSupported(int feature)
  {
    SupportedFeatureset = SupportedFeatureset | feature;
  }

  void SetHeadcodeSupported(int flag)
  {
    SupportedHeadcode = SupportedHeadcode | flag;
  }

  bool GetFeatureSupported(int features)
  {
    return (SupportedFeatureset & features) == features;
  }

  bool GetHeadcodeSupported(int flags)
  {
    return (SupportedHeadcode & flags) == flags;
  }

  public void SetupMenus()
  {
    if(GetFeatureSupported(FEATURE_EYES))
    {
      //eye window
      EyescriptMenu = new EyeScriptMenu();
      customMenus[customMenus.size()] = EyescriptMenu;
    
      //joystick window

    }

    //lamp window
    if(GetFeatureSupported(FEATURE_LAMPS))
    {
    }

    //livery window
    if(GetFeatureSupported(FEATURE_LIVERIES))
    {
    }

    //face window
    if(GetFeatureSupported(FEATURE_FACES))
    {
    }

    //loco window

    //smoke window
    if(GetFeatureSupported(FEATURE_SMOKE))
    {
    }

    if(GetOnlineLibrary())
    {
    }

    CustomScriptMenu[] override_menus = GetCustomMenus();
    int i;
    for(i = 0; i < override_menus.size(); i++)
      customMenus[customMenus.size()] = override_menus[i];

    for(i = 0; i < customMenus.size(); i++)
    {
      //customMenus[i].Init(me);
      customMenus[i].base = me;
      customMenus[i].Init();
    }
  }

  
  // ============================================================================
  // Name: GetTTTELocomotiveSettings()
  // Desc: Retrieves the settings Soup from the TTTELocomotive Settings asset.
  // ============================================================================
  Soup GetTTTELocomotiveSettings()
  {
    if(TTTELocoLibrary)
      return TTTELocoLibrary.GetSettings();

    return Constructors.NewSoup();
  }

  //Online fuctions
  TTTEOnline GetOnlineLibrary()
  {
    if(TTTELocoLibrary)
      return TTTELocoLibrary.GetOnlineLibrary();

    return null;
  }

  OnlineGroup GetSocialGroup()
  {
    TTTEOnline onlineLibrary = GetOnlineLibrary();
    return onlineLibrary.GetPersonalGroup();
  }

  public void BaseInit(Asset asset)
  {
    TTTELocoLibrary = cast<tttelib>World.GetLibrary(asset.LookupKUIDTable("tttelocomotive"));

    ScriptAsset = World.GetLibrary(asset.LookupKUIDTable("tttelocomotive")).GetAsset();
    myConfig = asset.GetConfigSoup();
    ExtensionsContainer = asset.GetConfigSoup().GetNamedSoup("extensions");

    strTable = ScriptAsset.GetStringTable(); // String table to be used for obtaining information inside the Config
  }
  
  // ============================================================================
  // Custom Override Functions
  // Desc: Override the following functions in tttestub.gs to provide custom functionality.
  // ============================================================================

  // ============================================================================
  // Name: GetCustomMenus()
  // Desc: Return a list of custom script menus supported by this locomotive.
  // ============================================================================
  public CustomScriptMenu[] GetCustomMenus()
  {
    return new CustomScriptMenu[0];
  }
};