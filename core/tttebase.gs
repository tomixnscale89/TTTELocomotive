include "gs.gs"
include "tttehelpers.gs"
include "tttemenu.gs"
include "eyescriptmenu.gs"
include "joystickmenu.gs"
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
  public define int POPUP_WIDTH = 300;
  public define int POPUP_HEIGHT = 300;
  public define int BROWSER_TRAIN_MARGIN = 15;
  public define int SURVEYOR_MENU_OFFSET = 250;

  public define int BROWSER_WIDTH = 40;
  Browser browser;
  
  CustomScriptMenu CurrentMenu = null;

  CustomScriptMenu EyescriptMenu  = null;
  CustomScriptMenu JoystickMenu   = null;
  CustomScriptMenu LampMenu       = null;
  CustomScriptMenu LiveryMenu     = null;
  CustomScriptMenu FaceMenu       = null;
  CustomScriptMenu LocoMenu       = null;
  CustomScriptMenu SmokeMenu      = null;
  CustomScriptMenu SocialMenu     = null;

  //Eye stuff
	//These variables keep track of the rotation of the eyes, and will be dynamically updated incrementally. Rotations are defined relative to 0, with 0 being the absolute center of each axis.
	public float eyeX = 0.0; //Left-Right Eye Rotation
	public float eyeY = 0.0; // Eye Roll
	public float eyeZ = 0.0; // Up-Down Eye Rotation

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
  int GetTTTETrainIndex();
  int GetTTTETrainSize();

  public CustomScriptMenu[] GetCustomMenus();

  // ============================================================================
  // Name: RefreshBrowser()
  // Desc: Updates all browser parameters by reloading the HTML strings.
  // ============================================================================

  public void RefreshBrowser()
  {
    if(CurrentMenu != null)
      popup.LoadHTMLString(self.GetAsset(), CurrentMenu.GetMenuHTML());
    
    // if(CurrentMenu >= BROWSER_CUSTOMMENU_0)
    // {
    //   int menuID = CurrentMenu - BROWSER_CUSTOMMENU_0;
    //   popup.LoadHTMLString(GetAsset(), customMenus[menuID].GetMenuHTML());
    // }
    // else
    // {
    //   bool isTransparent = false;

    //   switch(CurrentMenu)
    //   {
    //     case BROWSER_NONE:
    //       PopupClosed = true;
    //       popup = null;
    //       break;
    //     case BROWSER_EYEMENU:
    //       popup.LoadHTMLString(GetAsset(), GetEyeWindowHTML());
    //       break;
    //     case BROWSER_JOYSTICKMENU:
    //       isTransparent = true;
    //       popup.LoadHTMLString(GetAsset(), GetJoystickWindowHTML());
    //       JoystickThread();
    //       break;
    //     case BROWSER_LAMPMENU:
    //       popup.LoadHTMLString(GetAsset(), GetLampWindowHTML());
    //       break;
    //     case BROWSER_LIVERYMENU:
    //       popup.LoadHTMLString(GetAsset(), GetLiveryWindowHTML());
    //       break;
    //     case BROWSER_FACEMENU:
    //       popup.LoadHTMLString(GetAsset(), GetFaceWindowHTML());
    //       break;
    //     case BROWSER_LOCOMENU:
    //       popup.LoadHTMLString(GetAsset(), GetLocoWindowHTML());
    //       popup.SetElementProperty("shakeintensity", "value", (string)b_ShakeIntensity);
    //       popup.SetElementProperty("shakeperiod", "text", (string)b_ShakePeriod);
    //       break;
    //     case BROWSER_SMOKEMENU:
    //       popup.LoadHTMLString(GetAsset(), GetSmokeWindowHTML());
    //       RefreshSmokeTags();
    //       break;
    //     case BROWSER_SOCIALMENU:
    //       popup.LoadHTMLString(GetAsset(), GetSocialWindowHTML());
    //       break;
    //     default:
    //       PopupClosed = true;
    //       popup = null;
    //   }

    //   if(popup)
    //   {
    //     // if(isTransparent)
    //     //   popup.SetWindowStyle(Browser.STYLE_POPOVER);
    //     // else
    //     //   popup.SetWindowStyle(Browser.STYLE_HUD_FRAME);
    //   }
      
    // }

    if(popup and CurrentMenu != JoystickMenu)
      popup.ResizeHeightToFit();
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
      JoystickMenu = new JoystickMenu();
      customMenus[customMenus.size()] = JoystickMenu;
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

  void createPopupWindow()
  {
    int popupLeftOffset = (GetTTTETrainSize() - 1) * (BROWSER_WIDTH + BROWSER_TRAIN_MARGIN);

    int surveyorOffset = 0;
    if(World.GetCurrentModule() == World.SURVEYOR_MODULE)
      surveyorOffset = SURVEYOR_MENU_OFFSET;

    popup = null;
    popup = Constructors.NewBrowser();
    popup.SetCloseEnabled(false);
    popup.SetWindowPosition(Interface.GetDisplayWidth() - BROWSER_WIDTH - POPUP_WIDTH - popupLeftOffset, (Interface.GetDisplayHeight() / 2) - (POPUP_HEIGHT / 2) + surveyorOffset);
    popup.SetWindowSize(POPUP_WIDTH, POPUP_HEIGHT);
    popup.SetWindowStyle(Browser.STYLE_HUD_FRAME);
    popup.SetMovableByDraggingBackground(true);
    popup.SetWindowVisible(true);
    //popup.LoadHTMLString(GetAsset(), GetMenuHTML());
  }

  void closePopup()
  {
    if(CurrentMenu) CurrentMenu.Close();
    CurrentMenu = null;
    RefreshBrowser();
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

  int GetTTTETrainIndex()
  {
    //is_TTTELocomotive
    Vehicle[] vehicles = self.GetMyTrain().GetVehicles();
    int num_vehicles = 0;
    int i;
    for(i = 0; i < vehicles.size(); i++)
    {
      Soup properties = vehicles[i].GetProperties();
      bool is_TTTE = properties.GetNamedTagAsBool("is_TTTELocomotive", false);

      if(me == vehicles[i])
        return num_vehicles;
      
      if(is_TTTE)
        num_vehicles++;
    }

    return -1;
  }

  int GetTTTETrainSize()
  {
    //is_TTTELocomotive
    Vehicle[] vehicles = self.GetMyTrain().GetVehicles();
    int num_vehicles = 0;
    int i;
    for(i = 0; i < vehicles.size(); i++)
    {
      Soup properties = vehicles[i].GetProperties();
      bool is_TTTE = properties.GetNamedTagAsBool("is_TTTELocomotive", false);
      if(is_TTTE)
        num_vehicles++;
    }

    return num_vehicles;
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