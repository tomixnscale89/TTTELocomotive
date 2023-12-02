include "gs.gs"
include "tttehelpers.gs"
include "tttemenu.gs"
include "eyescriptmenu.gs"
include "joystickmenu.gs"
include "lampmenu.gs"
include "liverymenu.gs"
include "facemenu.gs"
include "locomenu.gs"
include "smokemenu.gs"
include "submeshmenu.gs"
include "soundmenu.gs"
include "socialmenu.gs"
include "facechartmenu.gs"
include "tttelib.gs"
include "vehicle.gs"
include "stringtable.gs"

// yuck
include "tttelocomotive.gs"
include "tttewagon.gs"

class TTTEBase isclass TTTEHelpers
{
  public Vehicle self;

  tttelib TTTELocoLibrary;
  TTTEOnline onlineLibrary;

  Asset ScriptAsset = null;
  public StringTable strTable = null; // This asset's string table, saved for convenient fast access

  //Config data
  public Soup myConfig;
  public Soup ExtensionsContainer;
  public Soup FacesContainer;
  public Soup LiveryContainer;
  public Soup LiveryTextureOptions;
  public Soup BogeyLiveryTextureOptions;
  public Soup SmokeboxContainer;
  public Soup BuffersContainer;
  public Soup ExtraLampsContainer;
  public Soup FaceChartContainer;
  public Soup SubmeshContainer;
  public Soup SoundContainer;
  public bool[] ExtraLampVisibility;
  public Asset[] ExtraLampAssets;
  
  Asset coupler_idle, coupler_coupled; // legacy couplers


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
  define int FEATURE_FACECHART    = 1 << 6;
  define int FEATURE_SUBMESHES    = 1 << 7;
  define int FEATURE_SOUNDS       = 1 << 8;

  public define int CAR_DERAILED = -1;
  public define int CAR_CENTER   =  0;
  public define int CAR_FRONT    =  1;
  public define int CAR_BACK     =  2;
  public define int CAR_SINGLE   =  3; // CAR_FRONT + CAR_BACK == CAR_SINGLE. Yes, this is intentional.

  public Browser popup;
  public define int POPUP_WIDTH = 300;
  public define int POPUP_HEIGHT = 300;
  public define int BROWSER_TRAIN_MARGIN = 15;
  public define int SURVEYOR_MENU_OFFSET = 250;

  public define int BROWSER_WIDTH = 40;
  Browser browser;
  
  public CustomScriptMenu CurrentMenu = null;

  CustomScriptMenu EyescriptMenu  = null;
  CustomScriptMenu JoystickMenu   = null;
  CustomScriptMenu LampMenu       = null;
  CustomScriptMenu LiveryMenu     = null;
  CustomScriptMenu FaceMenu       = null;
  CustomScriptMenu LocoMenu       = null;
  CustomScriptMenu SmokeMenu      = null;
  CustomScriptMenu SubmeshMenu    = null;
  CustomScriptMenu SoundMenu      = null;
  CustomScriptMenu FaceChartMenu  = null;
  CustomScriptMenu SocialMenu     = null;

  //Eye stuff
	//These variables keep track of the rotation of the eyes, and will be dynamically updated incrementally. Rotations are defined relative to 0, with 0 being the absolute center of each axis.
	public float eyeX = 0.0; //Left-Right Eye Rotation
	public float eyeY = 0.0; // Eye Roll
	public float eyeZ = 0.0; // Up-Down Eye Rotation

  //whether to translate the eyes instead of rotating them
  public bool eyeTranslateX = false;
  public bool eyeTranslateY = false;
  public float eyeTranslateXScale = 1.0;
  public float eyeTranslateYScale = 1.0;

  //Headcode stuff
  public Asset headlight_asset;      // headlight asset used by the loco
  public int m_headCode = 0;   // Stores the current state of the headcode lamps

  //Livery stuff
  Asset textureSet; // Texture asset we will use to grab the textures

  public int skinSelection; // Integer used to store the current skin of the asset. This will default to zero, unless forced in Init().
  int m_copySkin; // May not be needed..
  int m_copySkinBogey;
  Asset[] InstalledDLSLiveries;
  Asset[] DLSLiveries;

  //Face stuff
  public int faceSelection;
  public int DLSfaceSelection;
  public Asset[] InstalledDLSFaces;
  public Asset[] DLSFaces;

  //Loco stuff
  public bool b_CoupleLockEnabled = false;

  //Smoke stuff
  public Soup SmokeEdits;
  public int BoundWheesh = -1;

  //Social stuff
  public string assignedFriend;

  int eyeQueueFrame = 0;
  EyeFrame[] eyeQueue;

  public define int HEADCODE_BL = 1;
  public define int HEADCODE_BC = 2;
  public define int HEADCODE_BR = 4;
  public define int HEADCODE_TC = 8;

  public define int HEADCODE_NONE = 0;
  public define int HEADCODE_ALL_LAMPS = HEADCODE_BL | HEADCODE_BC | HEADCODE_BR | HEADCODE_TC;
  public define int HEADCODE_TAIL_LIGHTS = HEADCODE_BL | HEADCODE_BR;
  public define int HEADCODE_BRANCH = HEADCODE_BL;
  public define int HEADCODE_EXPRESS = HEADCODE_BL | HEADCODE_BR;
  public define int HEADCODE_EXPRESS_FREIGHT = HEADCODE_TC | HEADCODE_BR;
  public define int HEADCODE_EXPRESS_FREIGHT_2 = HEADCODE_BC | HEADCODE_BL;
  public define int HEADCODE_EXPRESS_FREIGHT_3 = HEADCODE_TC | HEADCODE_BL;
  public define int HEADCODE_GOODS = HEADCODE_BC | HEADCODE_BR;
  public define int HEADCODE_LIGHT = HEADCODE_TC;
  public define int HEADCODE_THROUGH_FREIGHT = HEADCODE_TC | HEADCODE_BC;
  public define int HEADCODE_TVS = HEADCODE_BR;

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
  public Soup GetTTTELocomotiveSettings();
  public TTTEOnline GetOnlineLibrary();
  int GetTTTETrainIndex();
  int GetTTTETrainSize();

  public CustomScriptMenu[] GetCustomMenus();

  // ============================================================================
  // Name: HeadcodeDescription()
  // Desc: Returns the description (aka name) of the headcode selected.
  // We use this instead of placing it inside the traincar config to save extra
  // Data the user has to put in their own creations. Plus, this will never change
  // so there is no reason for the user to specify what headcodes to use.
  // ============================================================================

  string HeadcodeDescription(int headcode)
  {
    string temp = "xxx"; // Create a temporary scratch string to use

    if (FlagTest(headcode, HEADCODE_NONE)) temp = strTable.GetString("headcode_none");
    if (FlagTest(headcode, HEADCODE_ALL_LAMPS)) temp = strTable.GetString("headcode_all");
    if (FlagTest(headcode, HEADCODE_TAIL_LIGHTS)) temp = strTable.GetString("headcode_tail");
    if (FlagTest(headcode, HEADCODE_BRANCH)) temp = strTable.GetString("headcode_branch");
    if (FlagTest(headcode, HEADCODE_EXPRESS)) temp = strTable.GetString("headcode_express");
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT)) temp = strTable.GetString("headcode_express_f1");
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT_2)) temp = strTable.GetString("headcode_express_f2");
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT_3)) temp = strTable.GetString("headcode_express_f3");
    if (FlagTest(headcode, HEADCODE_GOODS)) temp = strTable.GetString("headcode_goods");
    if (FlagTest(headcode, HEADCODE_LIGHT)) temp = strTable.GetString("headcode_light");
    if (FlagTest(headcode, HEADCODE_THROUGH_FREIGHT)) temp = strTable.GetString("headcode_thru_freight");
    if (FlagTest(headcode, HEADCODE_TVS)) temp = strTable.GetString("headcode_tvs");
    return temp;
  }

  // ============================================================================
  // Name: GetHeadcodeFlags()
  // Desc: Converts a headcode number to a series of flags.
  // ============================================================================

  int GetHeadcodeFlags(int headcode_number)
  {
    int returnFlags = 0;
    switch(headcode_number)
    {
      case 0:
        returnFlags = HEADCODE_NONE;
        break;
      case 1:
        returnFlags = HEADCODE_ALL_LAMPS;
        break;
      case 2:
        returnFlags = HEADCODE_TAIL_LIGHTS;
        break;
      case 3:
        returnFlags = HEADCODE_BRANCH;
        break;
      case 4:
        returnFlags = HEADCODE_EXPRESS;
        break;
      case 5:
        returnFlags = HEADCODE_EXPRESS_FREIGHT;
        break;
      case 6:
        returnFlags = HEADCODE_EXPRESS_FREIGHT_2;
        break;
      case 7:
        returnFlags = HEADCODE_EXPRESS_FREIGHT_3;
        break;
      case 8:
        returnFlags = HEADCODE_GOODS;
        break;
      case 9:
        returnFlags = HEADCODE_LIGHT;
        break;
      case 10:
        returnFlags = HEADCODE_THROUGH_FREIGHT;
        break;
      case 11:
        returnFlags = HEADCODE_TVS;
        break;
      default:
        returnFlags = HEADCODE_NONE;
    }
    return returnFlags;
  }

  // ============================================================================
  // Name: RefreshBrowser()
  // Desc: Updates all browser parameters by reloading the HTML strings.
  // ============================================================================

  public void RefreshBrowser()
  {
    TrainzScript.Log("refreshing browser");
    if(CurrentMenu != null)
    {
      popup.LoadHTMLString(self.GetAsset(), CurrentMenu.GetMenuHTML());
      CurrentMenu.PostRefresh();
    }

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

  public bool GetFeatureSupported(int features)
  {
    return (SupportedFeatureset & features) == features;
  }

  public bool GetHeadcodeSupported(int flags)
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
      LampMenu = new LampMenu();
      customMenus[customMenus.size()] = LampMenu;
    }

    //livery window
    if(GetFeatureSupported(FEATURE_LIVERIES))
    {
      LiveryMenu = new LiveryMenu();
      customMenus[customMenus.size()] = LiveryMenu;
    }

    //face window
    if(GetFeatureSupported(FEATURE_FACES))
    {
      FaceMenu = new FaceMenu();
      customMenus[customMenus.size()] = FaceMenu;
    }

    //loco window
    LocoMenu = new LocoMenu();
    customMenus[customMenus.size()] = LocoMenu;

    //smoke window
    if(GetFeatureSupported(FEATURE_SMOKE))
    {
      SmokeMenu = new SmokeMenu();
      customMenus[customMenus.size()] = SmokeMenu;
    }

    if(GetFeatureSupported(FEATURE_SUBMESHES))
    {
      SubmeshMenu = new SubmeshMenu();
      customMenus[customMenus.size()] = SubmeshMenu;
    }

    if (GetFeatureSupported(FEATURE_SOUNDS))
    {
      SoundMenu = new SoundMenu();
      customMenus[customMenus.size()] = SoundMenu;
    }

    if(GetFeatureSupported(FEATURE_FACECHART))
    {
      FaceChartMenu = new FaceChartMenu();
      customMenus[customMenus.size()] = FaceChartMenu;
    }

    if(GetOnlineLibrary())
    {
      SocialMenu = new SocialMenu();
      customMenus[customMenus.size()] = SocialMenu;
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
    self.Sniff(popup, "Browser-URL", "", true);

    popup.SetCloseEnabled(false);
    //popup.SetWindowPosition(Interface.GetDisplayWidth() - BROWSER_WIDTH - POPUP_WIDTH - popupLeftOffset, (Interface.GetDisplayHeight() / 2) - (POPUP_HEIGHT / 2) + surveyorOffset);
    int popupWidth = POPUP_WIDTH;
    if(CurrentMenu != null)
      popupWidth = CurrentMenu.GetMenuWidth();
    
    popup.SetWindowPosition(Interface.GetDisplayWidth() - BROWSER_WIDTH - popupWidth - popupLeftOffset, (Interface.GetDisplayHeight() / 2) - (POPUP_HEIGHT / 2) + surveyorOffset);
    popup.SetWindowSize(popupWidth, POPUP_HEIGHT);
    popup.SetWindowStyle(Browser.STYLE_HUD_FRAME);
    popup.SetMovableByDraggingBackground(true);
    popup.SetWindowVisible(true);
    //popup.LoadHTMLString(GetAsset(), GetMenuHTML());
  }

  void closePopup()
  {
    popup = null;
    CurrentMenu = null;
    RefreshBrowser();
  }

  // ============================================================================
  // Name: TickThread()
  // Desc: Ticks the current menu
  // ============================================================================

  thread void TickThread(CustomScriptMenu menu)
  {
    if(menu._tick_running)
      return;
    menu._tick_running = true;

    while(CurrentMenu == menu or (menu.AlwaysTick() and menu._tick_running))
    {
      if(menu and menu.GetTickInterval() > 0.0 and menu._tick_running)
      {
        menu.Tick();
        self.Sleep(menu.GetTickInterval());
      }
      else
        self.Sleep(0.1);
    }

    //tell the menu to close
    menu.Close();

    menu._tick_running = false;
  }
  
  // ============================================================================
  // Name: GetTTTELocomotiveSettings()
  // Desc: Retrieves the settings Soup from the TTTELocomotive Settings asset.
  // ============================================================================
  public Soup GetTTTELocomotiveSettings()
  {
    if(TTTELocoLibrary)
      return TTTELocoLibrary.GetSettings();

    return Constructors.NewSoup();
  }

  //Online fuctions
  public TTTEOnline GetOnlineLibrary()
  {
    if(TTTELocoLibrary)
      return TTTELocoLibrary.GetOnlineLibrary();

    return null;
  }

  public bool ShouldShowPopup()
  {
    return false;
  }

  bool InternalShouldShowPopup(Vehicle vehicle)
  {
    TTTEBase loco = cast<TTTELocomotive>(vehicle);
    if (loco) return loco.ShouldShowPopup();

    loco = cast<TTTEWagon>(vehicle);
    if (loco) return loco.ShouldShowPopup();

    return false;
  }

  int GetTTTETrainIndex()
  {
    //is_TTTELocomotive
    Vehicle[] vehicles = self.GetMyTrain().GetVehicles();
    int num_vehicles = 0;
    int i;
    for(i = 0; i < vehicles.size(); i++)
    {
      bool is_TTTE = InternalShouldShowPopup(vehicles[i]);

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
      if(InternalShouldShowPopup(vehicles[i]))
        num_vehicles++;
    }

    return num_vehicles;
  }

  // ============================================================================
  // Name: ConfigureHeadcodeLamps()
  // Desc: Sets the lamp arrangement from the headcode variable
  // Lamp names are fairly self-explanatory, but here is the full name for each lamp:
  // lamp_tc  = Top Center , lamp_bc = Bottom Center , Lamp_bl = Bottom Left , lamp_br = Bottom Right
  // ============================================================================
  public void ConfigureHeadcodeLamps()
  {
    // We are going to use SetFXAttachment to set the lamps in the correct positions.
    // This is using the names of the lamps that are in the effects container of the locomotive.
    if ((m_headCode & HEADCODE_BL) != 0) self.SetFXAttachment("lamp_bl", headlight_asset);
    else self.SetFXAttachment("lamp_bl", null);
    if ((m_headCode & HEADCODE_BC) != 0) self.SetFXAttachment("lamp_bc", headlight_asset);
    else self.SetFXAttachment("lamp_bc", null);
    if ((m_headCode & HEADCODE_BR) != 0) self.SetFXAttachment("lamp_br", headlight_asset);
    else self.SetFXAttachment("lamp_br", null);
    if ((m_headCode & HEADCODE_TC) != 0) self.SetFXAttachment("lamp_tc", headlight_asset);
    else self.SetFXAttachment("lamp_tc", null);
  }

  // ============================================================================
  // Name: ToggleExtraLamp()
  // Desc: Toggles the state of a custom lamp effect
  // ============================================================================
  public void ToggleExtraLamp(int TargetLamp)
  {
    ExtraLampVisibility[TargetLamp] = !ExtraLampVisibility[TargetLamp];
    string effectName = ExtraLampsContainer.GetIndexedTagName(TargetLamp);
    if(ExtraLampVisibility[TargetLamp])
      self.SetFXAttachment(effectName, ExtraLampAssets[TargetLamp]);
    else
      self.SetFXAttachment(effectName, null);
  }

  // ============================================================================
  // Name: BufferThread()
  // Desc: Buffer management thread
  // ============================================================================
  thread void BufferThread()
  {

  }
  
  // ============================================================================
  // Name: ConfigureSkins()
  // Parm:  None
  // Desc:
  // ============================================================================
  public void ConfigureSkins()
  {
    TrainzScript.Log("Setting skin to " + (string)skinSelection);

    int MainTextureGroupSize = 0;
    int BogeyTextureGroupSize = 0;
    //determine texturegroup offset
    int i;

    for(i = 0; i < LiveryTextureOptions.CountTags(); i++)
    {
      string TextureName = LiveryTextureOptions.GetIndexedTagName(i);
      string TextureMode = LiveryTextureOptions.GetNamedTag(TextureName);
      if(TextureMode == "none")
      {
        MainTextureGroupSize = MainTextureGroupSize + 1;
      }
      else if(TextureMode == "diffusenormal")
      {
        MainTextureGroupSize = MainTextureGroupSize + 2;
      }
      else if(TextureMode == "pbrstandard")
      {
        MainTextureGroupSize = MainTextureGroupSize + 3;
      }
    }
    for(i = 0; i < BogeyLiveryTextureOptions.CountTags(); i++)
    {
      string TextureName = BogeyLiveryTextureOptions.GetIndexedTagName(i);
      string TextureMode = BogeyLiveryTextureOptions.GetNamedTag(TextureName);
      if(TextureMode == "none")
      {
        BogeyTextureGroupSize = BogeyTextureGroupSize + 1;
      }
      else if(TextureMode == "diffusenormal")
      {
        BogeyTextureGroupSize = BogeyTextureGroupSize + 2;
      }
      else if(TextureMode == "pbrstandard")
      {
        BogeyTextureGroupSize = BogeyTextureGroupSize + 3;
      }
    }

    TrainzScript.Log("Found texturegroup size of " + (string)MainTextureGroupSize + " and bogey texturegroup size of " + (string)BogeyTextureGroupSize);

    //increment this value for each texture, to loop along
    //use texturegroup offset
    m_copySkin = skinSelection * (MainTextureGroupSize + BogeyTextureGroupSize);

    for(i = 0; i < LiveryTextureOptions.CountTags(); i++)
    {
      string TextureName = LiveryTextureOptions.GetIndexedTagName(i);
      string TextureMode = LiveryTextureOptions.GetNamedTag(TextureName);
      if(TextureMode == "none")
      {
        self.SetFXTextureReplacement(TextureName,textureSet,m_copySkin);
        m_copySkin = m_copySkin + 1;
      }
      else if(TextureMode == "diffusenormal")
      {
        self.SetFXTextureReplacement(TextureName + "_diffuse",textureSet,m_copySkin);
        self.SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkin + 1);
        m_copySkin = m_copySkin + 2;
      }
      else if(TextureMode == "pbrstandard")
      {
        self.SetFXTextureReplacement(TextureName + "_albedo",textureSet,m_copySkin);
        self.SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkin + 1);
        self.SetFXTextureReplacement(TextureName + "_parameter",textureSet,m_copySkin + 2);
        m_copySkin = m_copySkin + 3;
      }
      else
      {
        TrainzScript.Log("Livery mode " + TextureMode + " is not supported!");
      }
    }

    //bogey liveries
    Bogey[] myBogies = self.GetBogeyList();

    int currentBogey;
    for(currentBogey = 0; currentBogey < myBogies.size(); currentBogey++)
    {
      if(myBogies[currentBogey])
      {
        m_copySkinBogey = m_copySkin;
        Bogey ActiveBogey = myBogies[currentBogey];

        for(i = 0; i < BogeyLiveryTextureOptions.CountTags(); i++)
        {
          string TextureName = BogeyLiveryTextureOptions.GetIndexedTagName(i);
          string TextureMode = BogeyLiveryTextureOptions.GetNamedTag(TextureName);
          if(TextureMode == "none")
          {
            ActiveBogey.SetFXTextureReplacement(TextureName,textureSet,m_copySkinBogey);
            m_copySkinBogey = m_copySkinBogey + 1;
          }
          else if(TextureMode == "diffusenormal")
          {
            ActiveBogey.SetFXTextureReplacement(TextureName + "_diffuse",textureSet,m_copySkinBogey);
            ActiveBogey.SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkinBogey + 1);
            m_copySkinBogey = m_copySkinBogey + 2;
          }
          else if(TextureMode == "pbrstandard")
          {
            ActiveBogey.SetFXTextureReplacement(TextureName + "_albedo",textureSet,m_copySkinBogey);
            ActiveBogey.SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkinBogey + 1);
            ActiveBogey.SetFXTextureReplacement(TextureName + "_parameter",textureSet,m_copySkinBogey + 2);
            m_copySkinBogey = m_copySkinBogey + 3;
          }
          else
          {
            TrainzScript.Log("Livery mode " + TextureMode + " is not supported!");
          }
        }
      }
    }
  }

  // ============================================================================
  // Name: ConfigureFaces()
  // Parm:  None
  // Desc: Configures the locomotive face. Uses a switch with faceSelection to determine the correct face to display.
  // ============================================================================
  public void ConfigureFaces()
  {
    TrainzScript.Log("Setting face to " + (string)faceSelection);
    //clear our faces
    int i;
    for(i = 0; i < FacesContainer.CountTags(); i++)
      self.SetMeshVisible(FacesContainer.GetIndexedTagName(i), false, 0.0);

    //DLS faces
    self.SetFXAttachment("face", null);

    bool showEyes = true;
    //set our active face to be visible
    if(faceSelection > -1)
    {
      self.SetMeshVisible(FacesContainer.GetIndexedTagName(faceSelection), true, 0.0);
      string activeFaceMesh = FacesContainer.GetIndexedTagName(faceSelection);

      showEyes = (SmokeboxContainer.GetIndexForNamedTag(activeFaceMesh) == -1);
    }
    else if(DLSfaceSelection > -1)
    {
      Asset FaceAsset = InstalledDLSFaces[DLSfaceSelection];
      self.SetFXAttachment("face", FaceAsset);
      Soup FaceExtensions = FaceAsset.GetConfigSoup().GetNamedSoup("extensions");
      string type = FaceExtensions.GetNamedTag("type");
      showEyes = (type != "smokebox");
    }

    //determine if this is a smokebox mesh
    if(showEyes)
    {
      self.SetMeshVisible("eye_l", true, 0.0);
      self.SetMeshVisible("eye_r", true, 0.0);
    }
    else
    {
      self.SetMeshVisible("eye_l", false, 0.0);
      self.SetMeshVisible("eye_r", false, 0.0);
    }
  }

  // ============================================================================
  // Name: UpdateSmoke()
  // Desc: Update all smoke values.
  // ============================================================================
  public void UpdateSmoke()
  {
    int i;
    for(i = 0; i < SmokeEdits.CountTags(); i++)
    {
      Soup CurrentSmoke = SmokeEdits.GetNamedSoup((string)i);
      int curProperty;
      for(curProperty = 0; curProperty < CurrentSmoke.CountTags(); curProperty++)
      {
        string curTagName = CurrentSmoke.GetIndexedTagName(curProperty);
        if(curTagName != "active" and curTagName != "expanded")
        {
          float value = CurrentSmoke.GetNamedTagAsFloat(curTagName);
          int phase = 0;
          TrainzScript.Log("Attempting to set " + curTagName + " to " + (string)value + " for smoke" + (string)i);
          if(curTagName == "rate") self.SetPFXEmitterRate(i, phase, value);
          if(curTagName == "velocity") self.SetPFXEmitterVelocity(i, phase, value);
          if(curTagName == "lifetime") self.SetPFXEmitterLifetime(i, phase, value);
          if(curTagName == "minsize") self.SetPFXEmitterMinSize(i, phase, value);
          if(curTagName == "maxsize") self.SetPFXEmitterMaxSize(i, phase, value);

        }
      }
    }
  }

  void OnlineUpdate(Message msg)
  {
    Soup parameters = msg.paramSoup;
    string user = parameters.GetNamedTag("username");
    Str.ToLower(user);
    string friendLower = Str.CloneString(assignedFriend);
    Str.ToLower(friendLower);

    if(user == friendLower)
    {
      EyeFrame[] eyeQueueTemp = new EyeFrame[0];
      //eyeQueue

      int newSelection = parameters.GetNamedTagAsInt("faceSelection", faceSelection);
      if(newSelection != faceSelection)
      {
        faceSelection = newSelection;
        if(faceSelection >= FacesContainer.CountTags())
          faceSelection = FacesContainer.CountTags() - 1;
        ConfigureFaces();
      }

      float dccValue = parameters.GetNamedTagAsFloat("dccValue", 0.0);
      self.GetMyTrain().SetDCCThrottle(dccValue);

      int packetSize = parameters.GetNamedTagAsInt("packetSize", 50);
      int i;
      for(i = 0; i < packetSize; i++)
      {
        Soup frameSoup = parameters.GetNamedSoup((string)i);
        EyeFrame frame = new EyeFrame();
        frame.x = frameSoup.GetNamedTagAsFloat("eyeX");
        frame.y = frameSoup.GetNamedTagAsFloat("eyeY");
        eyeQueueTemp[eyeQueueTemp.size()] = frame;
      }
      //eyeX = parameters.GetNamedTagAsFloat("eyeX");
      //eyeY = parameters.GetNamedTagAsFloat("eyeY");

      //decide whether to append or replace
      int dist = eyeQueue.size() - eyeQueueFrame;

      //if we get more than 30 frames behind, replace
      if(dist > 30)
      {
        eyeQueueFrame = 0;
        eyeQueue = eyeQueueTemp;
      }
      else
      {
        for(i = 0; i < eyeQueueTemp.size(); i++)
          eyeQueue[eyeQueue.size()] = eyeQueueTemp[i];
      }
    }
  }

  public Soup GetOnlineDesc()
  {
    Soup soup = Constructors.NewSoup();
    soup.SetNamedTag("type", "locoDesc");
    soup.SetNamedTag("targetUser", assignedFriend);

    //config soups are locked
    Soup facesSoup = Constructors.NewSoup();
    facesSoup.Copy(FacesContainer);

    soup.SetNamedSoup("facesContainer", facesSoup);

    return soup;
  }

  public void BaseInit(Asset asset)
  {
    TTTELocoLibrary = cast<tttelib>World.GetLibrary(asset.LookupKUIDTable("tttelocomotive"));

    ScriptAsset = World.GetLibrary(asset.LookupKUIDTable("tttelocomotive")).GetAsset();
    myConfig = asset.GetConfigSoup();

    // TRS22, trainzbuild 5.0
    // at some point switch to this
    // myConfig = asset.GetConfigSoupCached();

    ExtensionsContainer = myConfig.GetNamedSoup("extensions");

    strTable = ScriptAsset.GetStringTable(); // String table to be used for obtaining information inside the Config

    // default to no face.
    faceSelection = -1;
    DLSfaceSelection = -1;

    
    BuffersContainer = ExtensionsContainer.GetNamedSoup("buffers");
    if(BuffersContainer.CountTags() > 0)
    {
      SetFeatureSupported(FEATURE_BUFFERS);
      BufferThread();
    }

    LiveryContainer = ExtensionsContainer.GetNamedSoup("liveries");
    LiveryTextureOptions = ExtensionsContainer.GetNamedSoup("livery-textures");
    BogeyLiveryTextureOptions = ExtensionsContainer.GetNamedSoup("bogey-livery-textures");
    SubmeshContainer = ExtensionsContainer.GetNamedSoup("submeshes");
    SoundContainer = ExtensionsContainer.GetNamedSoup("sfx");

    eyeTranslateX = ExtensionsContainer.GetNamedTagAsBool("eye-translate-x", false);
    eyeTranslateY = ExtensionsContainer.GetNamedTagAsBool("eye-translate-y", false);

    eyeTranslateXScale = ExtensionsContainer.GetNamedTagAsFloat("eye-translate-x-scale", eyeTranslateXScale);
    eyeTranslateYScale = ExtensionsContainer.GetNamedTagAsFloat("eye-translate-y-scale", eyeTranslateYScale);

    if(LiveryContainer.CountTags()) SetFeatureSupported(FEATURE_LIVERIES);
    if(SubmeshContainer.CountTags()) SetFeatureSupported(FEATURE_SUBMESHES);
    if(SoundContainer.CountTags()) SetFeatureSupported(FEATURE_SOUNDS);

    Soup KUIDTable = myConfig.GetNamedSoup("kuid-table");

    // Idle coupler mesh must have a default-mesh tag in the effects container or else it will not show.
    if(SoupHasTag(KUIDTable, "coupler_idle")) coupler_idle = asset.FindAsset("coupler_idle");
    if(SoupHasTag(KUIDTable, "coupler_coupled")) coupler_coupled = asset.FindAsset("coupler_coupled");

    if(SoupHasTag(KUIDTable, "lamp")) headlight_asset = asset.FindAsset("lamp");

    if(SoupHasTag(KUIDTable, "liveries")) textureSet = asset.FindAsset("liveries"); // Grab the textures we need for the livery swapping
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