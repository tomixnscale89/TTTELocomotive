
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

  // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/

  Library ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams;

  IKCoupler FrontCoupler;
  IKCoupler BackCoupler;
  Vehicle LastCoupleInteraction;

  int m_carPosition; // position of car in train - one of the options above
  Train train;

  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init(Asset asset) // Let's keep the init at the top for ease of access
  {
    // call the parent
    inherited(asset);
    self = me;
    BaseInit(asset);

    AddHandler(me, "TTTESetLivery", "", "SetLiveryHandler");

    // message handlers for ACS entry points and tail lights
    AddHandler(me, "Vehicle", "Coupled", "VehicleCoupleHandler");
    AddHandler(me, "Vehicle", "Decoupled", "VehicleDecoupleHandler");
    AddHandler(me, "Vehicle", "Derailed", "VehicleDerailHandler");
    // lashed on as it happens to do the right thing
    AddHandler(me, "World", "ModuleInit", "VehicleDecoupleHandler");

    // handler necessary for tail lights
    AddHandler(me, "Train", "Turnaround", "TrainTurnaroundHandler");

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

    Soup KUIDTable = myConfig.GetNamedSoup("kuid-table");
    m_carPosition = DetermineCarPosition();

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
        FrontCoupler.CoupleTo(OppositeCoupler);
      }
      else if(direction == "back")
      {
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
        FrontCoupler.DecoupleFrom(OppositeCoupler);
      }
      else if(direction == "back")
      {
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
        Sniff(train, "Train", "", true);
      }
    }
    else
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

    // faceSelection = soup.GetNamedTagAsInt("faces", faceSelection);
    // DLSfaceSelection = -1;
    // ConfigureFaces();

    skinSelection = soup.GetNamedTagAsInt("skin", skinSelection);
    ConfigureSkins();
    // load headcode
    //m_headCode = soup.GetNamedTagAsInt("headcode-lamps", m_headCode);
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
    //soup.SetNamedTag("headcode-lamps", m_headCode);

    //soup.SetNamedTag("faces", faceSelection);

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


    //lamp icon
    // // option to change headcode, this displays inside the ? HTML window in surveyor.
    // html = html + "<tr><td>";
    // html = html + "<a href=live://property/headcode_lamps><img kuid='<kuid:414976:103609>' width=32 height=32></a>";
    // html = html + "</tr></td>";
    //lamp status
    // string headcodeLampStr = "<a href=live://property/headcode_lamps>" + HeadcodeDescription(m_headCode) + "</a>";
    // html = html + "<tr><td>";
    // html = html + strTable.GetString1("headcode_select", headcodeLampStr);
    // html = html + "</tr></td>";

    //livery window
    html = html + "<tr><td>";
    html = html + "<a href=live://property/skin><img kuid='<kuid:414976:103610>' width=32 height=32></a>";
    html = html + "</tr></td>";
    
    //livery status
    string classSkinStr = "<a href=live://property/skin>" + LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(skinSelection)) + "</a>";
    html = html + "<tr><td>";
    html = html + strTable.GetString1("skin_select", classSkinStr);
    html = html + "</tr></td>";

    //face window
    // html = html + "<tr><td>";
    // html = html + "<a href=live://property/faces><img kuid='<kuid:414976:105808>' width=32 height=32></a>";
    // html = html + "</tr></td>";

    //face status
    // string FaceStr = "";
    // if(faceSelection > -1)
    //   FaceStr = FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(faceSelection));
    // else if(DLSfaceSelection > -1)
    // {
    //   Asset DLSFace = InstalledDLSFaces[DLSfaceSelection];
    //   StringTable FaceStrTable = DLSFace.GetStringTable();
    //   FaceStr = FaceStrTable.GetString("displayname");
    //   if(!FaceStr or FaceStr == "")
    //     FaceStr = DLSFace.GetLocalisedName();
    // }

    // string classFaceStr = "<a href=live://property/faces>" + FaceStr + "</a>";
    // html = html + "<tr><td>";
    // html = html + strTable.GetString1("faces_select", classFaceStr);
    // html = html + "</tr></td>";

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
    // if (p_propertyID == "headcode_lamps")
    // {
    //   return "list";
    // }
    // else if (p_propertyID == "faces")
    // {
    //   return "list";
    // }
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
    // if (p_propertyID == "headcode_lamps")
    // {
    //   return strTable.GetString("headcode_name");
    // }
    // if (p_propertyID == "faces")
    // {
    //   return strTable.GetString("faces_name");
    // }
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
    // if (p_propertyID == "headcode_lamps")
    // {
    //   return strTable.GetString("headcode_description");
    // }
    // else if(p_propertyID == "faces")
    // {
    //   return strTable.GetString("faces_description");
    // }
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

    // if (p_propertyID == "headcode_lamps")
    // {
    //   for (i = 0; i < 12; i++) // Let us loop through the entire possible headcodes and list them all.
    //   {
    //     result[i] = HeadcodeDescription(GetHeadcodeFlags(i));
    //   }
    // }
    // else if (p_propertyID == "faces")
    // {
    //   for(i = 0; i < FacesContainer.CountTags(); i++) // Let us loop through the entire possible faces and list them all.
    //   {
    //     result[i] = FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(i));
    //   }
    // }
    if (p_propertyID == "skin")
    {
      for(i = 0; i < LiveryContainer.CountTags(); i++) // Let us loop through the entire possible skins and list them all.
          result[i] = LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(i));
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
    // if (p_propertyID == "headcode_lamps")
    // {
    //   if (p_index > -1 and p_index < 12)
    //   {
    //     m_headCode = GetHeadcodeFlags(p_index);
    //     ConfigureHeadcodeLamps();
    //   }
    // }
    // else if (p_propertyID == "faces")
    // {
    //   if (p_index > -1 and p_index < FacesContainer.CountTags())
    //   {
    //     faceSelection = p_index;
    //     DLSfaceSelection = -1;
    //     ConfigureFaces();
    //   }
    // }
    if (p_propertyID == "skin")
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

};

//Legacy tttestub compat
class tttewagon isclass TTTEWagon {};
