
include "vehicle.gs"
include "meshobject.gs"
include "tttelib.gs"
include "tttebase.gs"
include "couple.gs" //procedural coupler <kuid:414976:104101> Procedural Coupler

// ============================================================================
// Name: TTTEWagon
// Desc: Script class for a generic TTTE Wagon
// ============================================================================
class TTTEWagon isclass Vehicle, TTTEBase
{
  tttelib TTTEWagonLibrary;

  int DetermineCarPosition();
  void SniffMyTrain();
  void createMenuWindow();

  string GetMenuHTML();
  thread void BrowserThread();
  void UpdateInterfacePosition();

  // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/

  Library ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams;

  IKCoupler FrontCoupler;
  IKCoupler BackCoupler;
  Vehicle LastCoupleInteraction;

  int m_carPosition; // position of car in train - one of the options above
  bool m_cameraTarget; // Is this the camera target?

  bool BrowserClosed;

  Train train;

  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init(Asset asset) // Let's keep the init at the top for ease of access
  {
    int i;
    
    // call the parent
    inherited(asset);
    self = me;
    BaseInit(asset);

    FacesContainer = ExtensionsContainer.GetNamedSoup("faces");
    ExtraLampsContainer = ExtensionsContainer.GetNamedSoup("extra-lamps");
    FaceChartContainer = ExtensionsContainer.GetNamedSoup("face-chart");

    if(FacesContainer.CountTags()) SetFeatureSupported(FEATURE_FACES);
    if(HasMesh("eye_l") and HasMesh("eye_r")) SetFeatureSupported(FEATURE_EYES);
    if(FaceChartContainer.CountTags()) SetFeatureSupported(FEATURE_FACECHART);

    Soup TTTESettings = GetTTTELocomotiveSettings();
    bool RandomizeFaces = TTTESettings.GetNamedSoup("random-faces/").GetNamedTagAsBool("value", false);
    if(RandomizeFaces and FacesContainer.CountTags()) faceSelection = Math.Rand(0, FacesContainer.CountTags());
    else if (FacesContainer.CountTags())
    {
      // give us a face.
      faceSelection = 0;
    }
    
    //set initial extra lamp states to none
    if(ExtraLampsContainer)
    {
      int TagCount = ExtraLampsContainer.CountTags();
      ExtraLampAssets = new Asset[TagCount];
      ExtraLampVisibility = new bool[TagCount];
      //int i;
      for(i = 0; i < TagCount; i++)
      {
        string effectName = ExtraLampsContainer.GetIndexedTagName(i);
        MeshObject lampMesh = GetFXAttachment(effectName);
        ExtraLampVisibility[i] = false;
        if(lampMesh)
        {
          ExtraLampAssets[i] = lampMesh.GetAsset();
          SetFXAttachment(effectName, null);
        }
        else
          ExtraLampAssets[i] = null;
      }
    }

    SmokeboxContainer = ExtensionsContainer.GetNamedSoup("smokeboxes");
    
    // Setup menus after all features are setup
    SetupMenus();

    AddHandler(me, "TTTESetLivery", "", "SetLiveryHandler");

    // message handlers for ACS entry points and tail lights
    AddHandler(me, "Vehicle", "Coupled", "VehicleCoupleHandler");
    AddHandler(me, "Vehicle", "Decoupled", "VehicleDecoupleHandler");
    AddHandler(me, "Vehicle", "Derailed", "VehicleDerailHandler");
    // lashed on as it happens to do the right thing
    AddHandler(me, "World", "ModuleInit", "VehicleDecoupleHandler");
    AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");

    // handler necessary for tail lights
    AddHandler(me, "Train", "Turnaround", "TrainTurnaroundHandler");
    AddHandler(me, "Interface", "LayoutChanged", "UpdateInterfacePositionHandler");

    AddHandler(Interface, "Camera", "Target-Changed",   "CameraTargetChangedHandler");

    // ****************************************************************************/
    // Define ACS Stuff
    // ****************************************************************************/
    // ACS callback handler
    AddHandler(me, "ACScallback", "", "ACShandler");
    ACSlib = World.GetLibrary(GetAsset().LookupKUIDTable("acslib"));
    ACSParams = new GSObject[1];
    ACSParams[0] = me;

    //Procedural Coupler System
    FrontCoupler = cast<IKCoupler>(GetFXAttachment("couple_front"));
    BackCoupler = cast<IKCoupler>(GetFXAttachment("couple_back"));
    //important
    if(FrontCoupler)
      FrontCoupler.PostInit(me, "front");
    if(BackCoupler)
      BackCoupler.PostInit(me, "back");
    
    
    createMenuWindow();
    AddHandler(me, "Browser-URL", "", "BrowserHandler");
    BrowserThread();

    Soup KUIDTable = myConfig.GetNamedSoup("kuid-table");
    m_carPosition = DetermineCarPosition();
    
    train = me.GetMyTrain(); // Get the train
    SniffMyTrain(); // Then sniff it
  }

  public void ModuleInitHandler(Message msg)
  {
    //regenerate browser
    BrowserClosed = true;
  }

  void SetLiveryHandler(Message msg)
  {
    if(msg.dst == me)
    {
      int skin = LiveryContainer.GetIndexForNamedTag(msg.minor);
      if(skin != -1)
      {
        skinSelection = skin;
        ConfigureSkins();
      }
    }
  }

  // ============================================================================
  // Name: GetRelativeDirectionString(Vehicle targetvehicle, string location)
  // Desc:
  // ============================================================================
  string GetRelativeDirectionString(Vehicle targetvehicle, string location)
  {
    //front and same - back
    //front and different - front
    //back and same - front
    //back and different - back
    bool SameDirection = (GetDirectionRelativeToTrain() == targetvehicle.GetDirectionRelativeToTrain());
    if(location == "front")
    {
      if(SameDirection) return "back";
      else return "front";
    }
    else if (location == "back")
    {
      if(SameDirection) return "front";
      else return "back";
    }
    return "front";
  }

  // ============================================================================
  // Name: PlayCoupleAnimation(string direction)
  // Desc:
  // ============================================================================
  void PlayCoupleAnimation(string direction)
  {
    //cache the most recent coupled vehicle in case another couple operation occurs
    Vehicle TargetVehicle = LastCoupleInteraction;
    if(TargetVehicle)
    {
      string OppositeDirection = GetRelativeDirectionString(TargetVehicle, direction);
      IKCoupler OppositeCoupler = cast<IKCoupler>(TargetVehicle.GetFXAttachment("couple_" + OppositeDirection));

      if(direction == "front")
      {
        if(FrontCoupler)
          FrontCoupler.CoupleTo(OppositeCoupler);
      }
      else if(direction == "back")
      {
        if(BackCoupler)
          BackCoupler.CoupleTo(OppositeCoupler);
      }
    }
  }

  // ============================================================================
  // Name: PlayDecoupleAnimation(string direction)
  // Desc:
  // ============================================================================

  void PlayDecoupleAnimation(string direction)
  {
    //cache the most recent coupled vehicle in case another couple operation occurs
    Vehicle TargetVehicle = LastCoupleInteraction;
    if(TargetVehicle)
    {
      string OppositeDirection = GetRelativeDirectionString(TargetVehicle, direction);
      IKCoupler OppositeCoupler = cast<IKCoupler>(TargetVehicle.GetFXAttachment("couple_" + OppositeDirection));

      if(direction == "front")
      {
        if(FrontCoupler)
          FrontCoupler.DecoupleFrom(OppositeCoupler);
      }
      else if(direction == "back")
      {
        if(BackCoupler)
          BackCoupler.DecoupleFrom(OppositeCoupler);
      }
    }
  }

  // ============================================================================
  // Name: ACSHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "ACS", "" messages
  // ============================================================================
  void ACShandler(Message msg)
  {
    // The ACS Handler is run when a coupling change is detected, either coupled or uncoupled
    // tokenwise msg.minor into pipe ('|') separated strings
    string[] callback = Str.Tokens(msg.minor, "|");
	  // Interface.Print("I entered the ACS Handler");
    if (callback.size() >= 3)
    {
      if(callback[0] == "coupler")
      {
        if(callback[2] == "screwlink")
        {
		      // couple is the name referenced inside the CONFIG of the Locomotive
          PlayCoupleAnimation(callback[1]);
          //SetFXAttachment("couple_" + callback[1], coupler_coupled);
        }
        else
        {
		      // couple is the name referenced inside the CONFIG of the Locomotive
          PlayDecoupleAnimation(callback[1]);
          //SetFXAttachment("couple_" + callback[1], coupler_idle);
        }
      }
    }
    else
    {
      TrainzScript.Log("ERROR: ACS Library returned invalid callback \"" + msg.minor + "\" - not divisible into at least 3 parts!");
    }
  }

  // ============================================================================
  // Name: VehicleCoupleHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Coupled" messages
  // ============================================================================
  void VehicleCoupleHandler(Message msg)
  {
    //Interface.Print("I entered the ACS Couple Handler");
    m_carPosition = DetermineCarPosition();

    if (msg.src != me) LastCoupleInteraction = cast<Vehicle>msg.src;
    // two vehicles that couple generate two couple events, one from each
    // so we can just act on ones that come from ourself
    if (msg.src == me)
    {
      ACSlib.LibraryCall("ACSrecalc", null, ACSParams);
    }

    SniffMyTrain();
  }

  // ============================================================================
  // Name: VehicleDecoupleHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Decoupled" messages
  // ============================================================================
  void VehicleDecoupleHandler(Message msg)
  {
    //Interface.Print("I entered the ACS Decouple Handler");

    m_carPosition = DetermineCarPosition();

    if (msg.src != me) LastCoupleInteraction = cast<Vehicle>msg.src;
    // only one decouple event is generated for each decouple,
    // not one for each half of train, so in this case have to check anyway
    // this is still reasonably efficient, as we can at least be confident
    // the decouple happened somewhere in our train

      ACSlib.LibraryCall("ACSrecalc", null, ACSParams);


    SniffMyTrain();
  }

  // ============================================================================
  // Name: VehicleDerailHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Derailed" messages
  // ============================================================================
  void VehicleDerailHandler(Message msg)
  {
    if(msg.src == me)
    {
      m_carPosition = CAR_DERAILED;

      if(train)
      {
        Sniff(train, "Train", "", false);
      }

      ACSlib.LibraryCall("ACSrecalc", null, ACSParams);
    }
  }

  // ============================================================================
  // Name: TrainTurnaroundHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Train", "Turnaround" messages
  // ============================================================================
  void TrainTurnaroundHandler(Message msg)
  {
    m_carPosition = DetermineCarPosition();
  }

  // ============================================================================
  // Name: DetermineCarPosition()
  // Desc: Determine our position in this consist
  // ============================================================================
  int DetermineCarPosition()
  {
    //Interface.Print("I entered Determine Car position");

    Train consist;
    Vehicle[] cars;
    int rval = CAR_CENTER;

    consist = GetMyTrain();
    cars = consist.GetVehicles();
    if (me == cars[0])
    {
      rval = rval + CAR_FRONT;
    }
    if (me == cars[cars.size() - 1])
    {
      rval = rval + CAR_BACK;
    }
    return rval;
  }

  // ============================================================================
  // Name: SniffMyTrain()
  // Desc: Maintain 'sniff' access on the current train for 'Train' messages
  // ============================================================================
  void SniffMyTrain()
  {
    Train oldTrain = train;
    //Interface.Print("I entered Sniff");

    train = GetMyTrain();

    if(oldTrain)
    {
      if(oldTrain != train)
      {
        Sniff(oldTrain, "Train", "", false);
        if (train)
          Sniff(train, "Train", "", true);
      }
    }
    else if (train)
    {
      Sniff(train, "Train", "", true);
    }
  }

  
  // ============================================================================
  // Name: SetProperties()
  // Parm: soup - properties soup to set internal state from
  // Desc: SetProperties is called by Trainz to load script state
  // ============================================================================
  public void SetProperties(Soup soup)
  {
    inherited(soup);

    faceSelection = soup.GetNamedTagAsInt("faces", faceSelection);
    DLSfaceSelection = -1;
    ConfigureFaces();

    skinSelection = soup.GetNamedTagAsInt("skin", skinSelection);
    ConfigureSkins();

    // load headcode
    m_headCode = soup.GetNamedTagAsInt("headcode-lamps", m_headCode);
  }


  // ============================================================================
  // Name: GetProperties()
  // Retn: Soup - properties soup containing the current internal state
  // Desc: GetProperties is called by Trainz to save script state
  // ============================================================================
  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    soup.SetNamedTag("is_TTTEWagon", true);

    // Save the headcode as a soup tag so we can access it in other locations.
    soup.SetNamedTag("headcode-lamps", m_headCode);

    soup.SetNamedTag("faces", faceSelection);

    soup.SetNamedTag("skin",skinSelection);

    return soup;
  }


  // ============================================================================
  // Name: GetDescriptionHTML()
  // Retn: string - HTML for a description pane
  // Desc: GetDescriptionHTML is
  // ============================================================================
  public string GetDescriptionHTML(void)
  {
    string html = inherited();

    //StringTable strTable = GetAsset().GetStringTable();
    html = html + "<html><body>";
    html = html + "<table cellspacing=2>";


    if(GetFeatureSupported(FEATURE_LAMPS))
    {
      //lamp icon
      // // option to change headcode, this displays inside the ? HTML window in surveyor.
      html = html + "<tr><td>";
      html = html + "<a href=live://property/headcode_lamps><img kuid='<kuid:414976:103609>' width=32 height=32></a>";
      html = html + "</tr></td>";
      //lamp status
      string headcodeLampStr = "<a href=live://property/headcode_lamps>" + HeadcodeDescription(m_headCode) + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("headcode_select", headcodeLampStr);
      html = html + "</tr></td>";
    }

    //livery window
    if(GetFeatureSupported(FEATURE_LIVERIES))
    {
      //livery window
      html = html + "<tr><td>";
      html = html + "<a href=live://property/skin><img kuid='<kuid:414976:103610>' width=32 height=32></a>";
      html = html + "</tr></td>";

      //livery status
      string classSkinStr = "<a href=live://property/skin>" + LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(skinSelection)) + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("skin_select", classSkinStr);
      html = html + "</tr></td>";
    }

    if(GetFeatureSupported(FEATURE_FACES))
    {
      //face window
      html = html + "<tr><td>";
      html = html + "<a href=live://property/faces><img kuid='<kuid:414976:105808>' width=32 height=32></a>";
      html = html + "</tr></td>";

      //face status
      string FaceStr = "";
      if(faceSelection > -1)
        FaceStr = FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(faceSelection));
      else if(DLSfaceSelection > -1)
      {
        Asset DLSFace = InstalledDLSFaces[DLSfaceSelection];
        StringTable FaceStrTable = DLSFace.GetStringTable();
        FaceStr = FaceStrTable.GetString("displayname");
        if(!FaceStr or FaceStr == "")
          FaceStr = DLSFace.GetLocalisedName();
      }

      string classFaceStr = "<a href=live://property/faces>" + FaceStr + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("faces_select", classFaceStr);
      html = html + "</tr></td>";
    }

    return html;
  }

  // ============================================================================
  // Name: GetPropertyType()
  // Parm: p_propertyID - name of property
  // Retn: string - type of property
  // Desc: GetPropertyType is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  string GetPropertyType(string p_propertyID)
  {
    if (p_propertyID == "headcode_lamps")
    {
      return "list";
    }
    if (p_propertyID == "faces")
    {
      return "list";
    }
    if (p_propertyID == "skin")
    {
      return "list";
    }

    return inherited(p_propertyID);
  }


  // ============================================================================
  // Name: GetPropertyName()
  // Parm: p_propertyID - name of property
  // Retn: string - user friendly display name of property
  // Desc: GetPropertyName is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  string GetPropertyName(string p_propertyID)
  {
    if (p_propertyID == "headcode_lamps")
    {
      return strTable.GetString("headcode_name");
    }
    if (p_propertyID == "faces")
    {
      return strTable.GetString("faces_name");
    }
    if (p_propertyID == "skin")
    {
      return strTable.GetString("skin_name");
    }

    return inherited(p_propertyID);
  }



  // ============================================================================
  // Name: GetPropertyDescription()
  // Parm: p_propertyID - name of property
  // Retn: string - user friendly description of property
  // Desc: GetPropertyDescription is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  string GetPropertyDescription(string p_propertyID)
  {
    if (p_propertyID == "headcode_lamps")
    {
      return strTable.GetString("headcode_description");
    }
    if(p_propertyID == "faces")
    {
      return strTable.GetString("faces_description");
    }
    if(p_propertyID == "skin")
    {
      return strTable.GetString("skin_description");
    }

    return inherited(p_propertyID);
  }


  // ============================================================================
  // Name: GetPropertyElementList()
  // Parm: p_propertyID - name of property
  // Retn: string[] - array of string descriptions for each value
  // Desc: GetPropertyElementList is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  public string[] GetPropertyElementList(string p_propertyID)
  {
    int i;
    string [] result = new string[0];

    if (p_propertyID == "headcode_lamps")
    {
      for (i = 0; i < 12; i++) // Let us loop through the entire possible headcodes and list them all.
      {
        result[i] = HeadcodeDescription(GetHeadcodeFlags(i));
      }
    }
    else if (p_propertyID == "faces")
    {
      for(i = 0; i < FacesContainer.CountTags(); i++) // Let us loop through the entire possible faces and list them all.
      {
        result[i] = FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(i));
      }
    }
    else if (p_propertyID == "skin")
    {
      for(i = 0; i < LiveryContainer.CountTags(); i++) // Let us loop through the entire possible skins and list them all.
      {
          result[i] = LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(i));
      }
    }
    else
    {
      result = inherited(p_propertyID);
    }

    return result;
  }


  // ============================================================================
  // Name: SetPropertyValue()
  // Parm: p_propertyID - name of property
  // Parm: p_value - string name of property value chosen
  // Parm: p_index - integer index of property value chosen
  // Desc: SetPropertyValue is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  void SetPropertyValue(string p_propertyID, string p_value, int p_index)
  {
    if (p_propertyID == "headcode_lamps")
    {
      if (p_index > -1 and p_index < 12)
      {
        m_headCode = GetHeadcodeFlags(p_index);
        ConfigureHeadcodeLamps();
      }
    }
    else if (p_propertyID == "faces")
    {
      if (p_index > -1 and p_index < FacesContainer.CountTags())
      {
        faceSelection = p_index;
        DLSfaceSelection = -1;
        ConfigureFaces();
      }
    }
    else if (p_propertyID == "skin")
    {
      if (p_index > -1 and p_index < LiveryContainer.CountTags())
      {
        skinSelection = p_index;
        ConfigureSkins();
      }
    }
    else
    {
      inherited(p_propertyID, p_value, p_index);
    }
  }

  // ============================================================================
  // Name: createMenuWindow()
  // Desc: Creates the browser.
  // ============================================================================
  void createMenuWindow()
  {
    browser = null;
    if ( !browser )	browser = Constructors.NewBrowser();
    Sniff(browser, "Browser-URL", "", true);
    
    browser.SetCloseEnabled(false);
  	//browser.SetWindowPosition(Interface.GetDisplayWidth()-450, Interface.GetDisplayHeight() - 625);
  	browser.SetWindowSize(BROWSER_WIDTH, 400);
    browser.SetWindowStyle(Browser.STYLE_NO_FRAME);
    browser.SetMovableByDraggingBackground(false);
  	browser.SetWindowVisible(true);
  	browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    browser.ResizeHeightToFit();
    BrowserClosed = false;

    UpdateInterfacePosition();
  }

  // ============================================================================
  // Name: GetMenuHTML()
  // Desc: Browser HTML tabs.
  // ============================================================================

  string GetMenuHTML()
  {
  	//StringTable strTable = GetAsset().GetStringTable();
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");

    output.Print("<table cellspacing=2>");

    int icon_scale = 32;

    // if(AssetObsolete)
    // {
    //   //output.Print("<a href='live://update'>Out of date! Click here to update.</a>");
    //   //output.Print("<br>");
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://update'><img kuid='<kuid:414976:101435>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    // }

    // give a little thumbnail of the traincar in question
    output.Print("<tr><td>");
    output.Print("<a href='live://focus-me' tooltip='" + GetLocalisedName() + "'><img kuid='" + GetAsset().GetKUID().GetHTMLString() + "' width=" + icon_scale + " height=" + icon_scale + "></a>");
    output.Print("</tr></td>");

    int i;
    for(i = 0; i < customMenus.size(); i++)
    {
      output.Print("<tr><td>");
      // output.Print("<a href='live://open_custom/" + (string)i + "'><img kuid='" + customMenus[i].GetIconKUIDString() + "' width=" + icon_scale + " height=" + icon_scale + "></a>");
      output.Print("<a href='live://open_custom/" + (string)i + "'><img kuid='" + customMenus[i].GetIconKUIDString() + "' color=#0377fc width=" + icon_scale + " height=" + icon_scale + "></a>");
      output.Print("</tr></td>");
    }

    output.Print("</table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }

  // ============================================================================
  // Name: UpdateInterfacePosition()
  // Desc: Updates the position of all UI elements
  // ============================================================================

  void UpdateInterfacePosition()
  {
    int browserLeftOffset = (GetTTTETrainSize() - GetTTTETrainIndex() - 1) * (BROWSER_WIDTH + BROWSER_TRAIN_MARGIN);

    int surveyorOffset = 0;
    if(World.GetCurrentModule() == World.SURVEYOR_MODULE)
      surveyorOffset = SURVEYOR_MENU_OFFSET;

    if(browser) browser.SetWindowPosition(Interface.GetDisplayWidth() - BROWSER_WIDTH - browserLeftOffset, (Interface.GetDisplayHeight() / 2) - (browser.GetWindowHeight() / 2) + surveyorOffset);
  }

  void UpdateInterfacePositionHandler(Message msg)
  {
    UpdateInterfacePosition();
  }

  void RefreshMenuBrowser()
  {
    browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    browser.ResizeHeightToFit();
  }

  // ============================================================================
  // Name: CameraTargetChangedHandler(Message msg)
  // Parm:  Message msg
  // Desc:
  // ============================================================================
  void CameraTargetChangedHandler(Message msg)
  {
    m_cameraTarget = (msg.src == me);
  }

  // @override
  public bool HasFocus()
  {
    return m_cameraTarget;
  }

  // @override
  public bool ShouldShowPopup()
  {
    return HasFocus();
  }

  // ============================================================================
  // Name: BrowserThread()
  // Desc: Recreates the browser if it is closed. (should be swapped for a module change handler)
  // ============================================================================
  thread void BrowserThread()
  {
    while(true)
    {
      
      if (!me.ShouldShowPopup())
      {
        CurrentMenu = null;
        browser = null;
        popup = null;
        BrowserClosed = true;
      }
      if (me.ShouldShowPopup() and BrowserClosed)
      {
        //replace this with keybind
        createMenuWindow();
        BrowserClosed = false;
      }

      UpdateInterfacePosition();

      Sleep(0.1);
    }
  }

  // ============================================================================
  // Name: BrowserHandler(Message msg)
  // Desc: Handles all browser input.
  // ============================================================================
  void BrowserHandler(Message msg)
  {
    TrainzScript.Log("handle browser message");
    if(!(browser and msg.src == browser) and !(popup and msg.src == popup))
      return;
    
    // if (msg.minor == "live://update")
    // {
    //   ShowUpdatePrompt();
    //   AssetObsolete = false;
    //   RefreshBrowser();
    // }
    if (msg.minor == "live://focus-me")
    {
      World.UserSetCamera(me);
    }
    else if (msg.minor == "live://return")
    {
      closePopup();
    }
    else if(TrainUtil.HasPrefix(msg.minor, "live://open_custom/"))
    {
      TrainzScript.Log("Opening custom menu.");
      string command = msg.minor["live://open_custom/".size(),];

      int menuID = Str.UnpackInt(command);

      if(CurrentMenu != customMenus[menuID])
      {
        CurrentMenu = customMenus[menuID];
        createPopupWindow();
        RefreshBrowser();
        CurrentMenu.Open();
        TickThread(CurrentMenu);
      }
      else
        closePopup();
    }
    else
    {
      if(CurrentMenu)
        CurrentMenu.ProcessMessage(msg.minor);
    }
  }
};

//Legacy tttestub compat
class tttewagon isclass TTTEWagon {};
