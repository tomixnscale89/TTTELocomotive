// ============================================================================
// File: lmssteam.gs
// Desc: Script class for the LMS "Princess Coronation" class locomotive
// ============================================================================
include "locomotive.gs" 


// ============================================================================
// Name: LMSsteam
// Desc: Script class for the LMS "Princess Coronation" locomotive
// ============================================================================
class LMSsteam isclass Locomotive
{
  StringTable m_strTable; // This asset's string table, saved for convenient fast access
  Library     m_ACSlib;   // reference to the Advanced Coupling System Library
  
  Asset m_tailLight;      // Oil tail light object
  Asset m_headcodeLamp;   // Oil marker light object for headcodes
  Asset m_LMS_vac_disconnected, m_LMS_vac_cross, m_LMS_vac_high;                    // three different possible vac brake pipes
  Asset m_LMS_screwlink_hanging, m_LMS_screwlink_coupled;                           // two options for the coupler
  Asset m_LMS_steam_heat_disconnected, m_LMS_steam_heat_connected;                  // two options for the steam heat pipes
  Asset m_buildersPlates; // Asset containing builders plate textures

  GSObject[] m_ACSParams;

  // Options for headcode lights;
  define int HEADCODE_NONE = 0;
  define int HEADCODE_ALL_LAMPS = 1;
  define int HEADCODE_TAIL_LIGHTS = 2;
  define int HEADCODE_SHUNTING = 3;
  define int HEADCODE_BR1964_CLASS_0 = 4;
  define int HEADCODE_BR1964_CLASS_1 = 5;
  define int HEADCODE_BR1964_CLASS_2 = 6;
  define int HEADCODE_BR1964_CLASS_3 = 7;
  define int HEADCODE_BR1964_CLASS_4 = 8;
  define int HEADCODE_BR1964_CLASS_5 = 9;
  define int HEADCODE_BR1964_CLASS_6 = 10;
  define int HEADCODE_BR1964_CLASS_7 = 11;
  define int HEADCODE_BR1964_CLASS_8 = 12;
  define int HEADCODE_BR1964_CLASS_9 = 13;
  define int HEADCODE_RCH1923_CLASS_A = 14;
  define int HEADCODE_RCH1923_CLASS_B = 15;
  define int HEADCODE_RCH1923_CLASS_C = 16;
  define int HEADCODE_RCH1923_CLASS_D = 17;
  define int HEADCODE_RCH1923_CLASS_E = 18;
  define int HEADCODE_RCH1923_CLASS_F = 19;
  define int HEADCODE_RCH1923_CLASS_G = 20;
  define int HEADCODE_RCH1923_CLASS_H = 21;
  define int HEADCODE_RCH1923_CLASS_J = 22;
  define int HEADCODE_RCH1923_CLASS_K = 23;

  int m_headCode;   // Stores the current state of the headcode lamps
  
  Soup m_runningNumberSoup;     // The prototypical running numbers for this vehicle

  public define int CAR_DERAILED = -1;
  public define int CAR_CENTER   =  0;
  public define int CAR_FRONT    =  1;
  public define int CAR_BACK     =  2;
  public define int CAR_SINGLE   =  3; // CAR_FRONT + CAR_BACK == CAR_SINGLE. Yes, this is intentional.

  int m_carPosition; // position of car in train - one of the options above

  Train m_train;

  Asset m_crew;


  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init()
  {
    // call the parent
    inherited();
    
    m_strTable = GetAsset().GetStringTable();

    // Get a reference to the ACSLib library
    m_ACSlib = World.GetLibrary(GetAsset().LookupKUIDTable("acslib"));

    // set up ACS Parameters
    m_ACSParams = new GSObject[1];
    m_ACSParams[0] = me;

    // Oil tail and headcode light objects
    m_tailLight = GetAsset().FindAsset("tail_light");
    m_headcodeLamp = GetAsset().FindAsset("headcode_lamp");
    
    // three different possible vac brake pipes
    m_LMS_vac_disconnected = GetAsset().FindAsset("vac_disconnected");
    m_LMS_vac_cross = GetAsset().FindAsset("vac_connected");
    m_LMS_vac_high = GetAsset().FindAsset("vac_high");
    
    // two options for the coupler
    m_LMS_screwlink_hanging = GetAsset().FindAsset("coupler_disconnected");
    m_LMS_screwlink_coupled = GetAsset().FindAsset("coupler_connected");
    
    // two options for the steam heat pipes
    m_LMS_steam_heat_disconnected = GetAsset().FindAsset("steamheat_disconnected");
    m_LMS_steam_heat_connected = GetAsset().FindAsset("steamheat_connected");

    m_runningNumberSoup = GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("running-numbers-447264");

    m_buildersPlates = GetAsset().FindAsset("builders_plates");

    m_headCode = 14; // Will be overwritten later in SetProperties().

    m_crew = GetAsset().FindAsset("crew_" + Math.Rand(0,3)); // random choice.
    
    ChooseRandomNumber(false);
    ConfigureVehicleForNumber();

    m_carPosition = DetermineCarPosition();
    ConfigureLights();

    // message handlers for ACS entry points and tail lights
    AddHandler(me, "Vehicle", "Coupled", "VehicleCoupleHandler");
    AddHandler(me, "Vehicle", "Decoupled", "VehicleDecoupleHandler");
    AddHandler(me, "Vehicle", "Derailed", "VehicleDerailHandler");
    // lashed on as it happens to do the right thing
    AddHandler(me, "World", "ModuleInit", "VehicleDecoupleHandler");

    // ACS callback handler
    AddHandler(me, "ACScallback", "", "ACShandler");

    // headcode / reporting number handler
    AddHandler(me, "SetTrainReportingNumber", "", "TrainReportingNumberHandler");

    // handler necessary for tail lights
    AddHandler(me, "Train", "Turnaround", "TrainTurnaroundHandler");

  }
  


  // ============================================================================
  // Name: ConfigureVehicleForNumber()
  // Desc: Sets the vehicle up for the current running number
  // ============================================================================
  void ConfigureVehicleForNumber()
  {
    string currentNumber = GetRunningNumber();
    if (currentNumber == "")
    {
      TrainzScript.Log ("WARNING: Blank running number when configuring vehicle \"" + GetName() + "\" with KUID " + GetAsset().GetKUID().GetLogString() + "!");
      return;
    }


    int buildersPlate = Str.ToInt(currentNumber) - 46220;
    
    if (buildersPlate >=0 and buildersPlate < 37)
    {

      if (!m_buildersPlates)
      {
        TrainzScript.Log ("WARNING: Builders plate texture asset for asset \"" + GetLocalisedName() + "\" with KUID " + GetAsset().GetKUID().GetLogString() + " not found?");
        return;
      }
      
      TrainzScript.Log ("Setting buildersplate: " + buildersPlate);
      
      SetFXTextureReplacement("buildersplate", m_buildersPlates, buildersPlate);
    }
    
    
    // also update the crew here
    if(m_crew)
    {
      SetFXAttachment("crew", m_crew);
    }
  }


  // ============================================================================
  // Name: ChooseRandomNumber()
  // Parm: force - true  -> force generate a new number
  //               false -> If false, respect current number
  // Desc: Sets the vehicle up for the current running number
  // ============================================================================
  void ChooseRandomNumber(bool force)
  {
    // check to see if we should generate a new random number
    
    if (!force)
    {
      // check to see if we have a current running number
      string currentNumber = GetRunningNumber();
      if (currentNumber != "")
      {
        // We already have a number, and we will not change it.
        return;
      }
    }
    
    
    // Verify we actually have defined running numbers
    
    int countNumbers = m_runningNumberSoup.CountTags();
    
    if (countNumbers <= 0)
    {
      TrainzScript.Log ("WARNING: Running numbers missing from asset \"" + GetLocalisedName() + "\" with KUID " + GetAsset().GetKUID().GetLogString() + "!");
      return;
    }

//    TrainzScript.Log ("Found " + countNumbers + " running numbers.");

    // Read numbers from config file
    int i;
    string[] locoNumbers = new string[countNumbers];
    for (i = 0; i < countNumbers; ++i)
    {
      string thisNumber = m_runningNumberSoup.GetNamedTag(m_runningNumberSoup.GetIndexedTagName(i));
      if (thisNumber[,1] = "#")
      {
//        TrainzScript.Log ("Stripping leading hash");
        thisNumber = thisNumber[1,];
      }

      locoNumbers[i] = thisNumber;
//      TrainzScript.Log ("Number " + (i + 1) + ": " + locoNumbers[i] + ".");
    }
    
    
    // Check which numbers are already allocated
    
    string[] availableNumbers;
    availableNumbers.copy(locoNumbers);
    
    // iterate over the list of vehicles
    Vehicle[] allVehicles = World.GetVehicleList();
    for (i = 0; i < allVehicles.size(); ++i)
    {
      // check if this vehicle has a running number
      string vehNumber = allVehicles[i].GetRunningNumber();
      if (vehNumber != "")
      {
        // check if this number is within our set
        int index;
        for (index = availableNumbers.size() - 1; index >= 0; index--)
        {
          if (vehNumber == availableNumbers[index])
          {
            // remove from available numbers list
            availableNumbers[index,index+1] = null;
//            TrainzScript.Log("Number " + vehNumber + " already in use.");
            break;
          }
        }
      }
    }


    string newRunningNumber;

    if (availableNumbers != null and availableNumbers.size() > 0)
    {
      // We have numbers available, pick one
      
      newRunningNumber = availableNumbers[Math.Rand(0, availableNumbers.size())];
    }
    else
    {
      // All appropriate numbers are already allocated
      // Of the three options (no number, duplicate number, wrong number)
      // a duplicate is preferred.
//      Interface.Log("All numbers for this vehicle are in use. Generating a random duplicate...");
          
      newRunningNumber = locoNumbers[Math.Rand(0, locoNumbers.size())];
    }

//    TrainzScript.Log("Setting number: " + newRunningNumber + ".");

    SetRunningNumber(newRunningNumber);

  }
  
  

  // ============================================================================
  // Name: ConfigureHeadcodeLamps()
  // Desc: Sets the lamp arrangement from the headcode variable
  // ============================================================================
  void ConfigureHeadcodeLamps(int headcode, string frontOrRear)
  {
    switch (headcode)
    {
      case HEADCODE_BR1964_CLASS_0:
      case HEADCODE_RCH1923_CLASS_G:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, null);
        
        break;
        
      case HEADCODE_BR1964_CLASS_1:
      case HEADCODE_RCH1923_CLASS_A:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_headcodeLamp);
        
        break;
        
      case HEADCODE_BR1964_CLASS_2:
      case HEADCODE_RCH1923_CLASS_B:
        
        SetFXAttachment("headcode_top_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, null);
        
        break;
        
      case HEADCODE_BR1964_CLASS_3:
      case HEADCODE_RCH1923_CLASS_C:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_headcodeLamp);
        
        break;
        
      case HEADCODE_BR1964_CLASS_4:
      case HEADCODE_RCH1923_CLASS_D:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_headcodeLamp);
        
        break;
        
      case HEADCODE_BR1964_CLASS_5:
        
        SetFXAttachment("headcode_top_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_headcodeLamp);
        
        break;
        
      case HEADCODE_BR1964_CLASS_6:
      case HEADCODE_RCH1923_CLASS_E:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_cess_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, null);
        
        break;
        
      case HEADCODE_BR1964_CLASS_7:
      case HEADCODE_RCH1923_CLASS_F:
              
        SetFXAttachment("headcode_top_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, null);
        
        break;
        
      case HEADCODE_BR1964_CLASS_8:
      case HEADCODE_RCH1923_CLASS_H:
      
        SetFXAttachment("headcode_top_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_center_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, null);
        
        break;
        
      case HEADCODE_BR1964_CLASS_9:
      case HEADCODE_RCH1923_CLASS_K:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, null);
        
        break;

      case HEADCODE_RCH1923_CLASS_J:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_headcodeLamp);
        
        break;
        
      case HEADCODE_ALL_LAMPS:
        
        SetFXAttachment("headcode_top_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_center_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_cess_" + frontOrRear, m_headcodeLamp);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_headcodeLamp);
        
        break;

      case HEADCODE_TAIL_LIGHTS:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, m_tailLight);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_tailLight);
        
        break;

      case HEADCODE_SHUNTING:
        
        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, m_tailLight);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, m_headcodeLamp);
        
        break;
        
      case HEADCODE_NONE:
      default:

        SetFXAttachment("headcode_top_" + frontOrRear, null);
        SetFXAttachment("headcode_center_" + frontOrRear, null);
        SetFXAttachment("headcode_cess_" + frontOrRear, null);
        SetFXAttachment("headcode_sixfoot_" + frontOrRear, null);

    }
  }




  // ============================================================================
  // Name: ConfigureLights()
  // Desc: Sets the vehicle up for the required light state
  // ============================================================================
  void ConfigureLights()
  {
    // Check to see if there's a loco in the train - we only have lights on when there is a possibility we may move
    if (GetMyTrain().GetFrontmostLocomotive())
    {
      if (m_headCode == HEADCODE_SHUNTING)
      {
        // shunting is a special case, it is displayed on both ends at once, and is not switched off with a train attached
        ConfigureHeadcodeLamps(m_headCode, "front");
      }
      else
      {
        switch (m_carPosition)
        {
          case CAR_FRONT:
            if(GetDirectionRelativeToTrain())
            {
  //            TrainzScript.Log("LMSsteam: car is front car facing the same direction as train");
              ConfigureHeadcodeLamps(m_headCode, "front");
            }
            else
            {
  //            TrainzScript.Log("LMSsteam: car is front car facing in opposite direction to train");
              ConfigureHeadcodeLamps(HEADCODE_NONE, "front");
            }
            break;
  
          case CAR_BACK:
            if(GetDirectionRelativeToTrain())
            {
  //            TrainzScript.Log("LMSsteam: car is end car facing the same direction as train");
              ConfigureHeadcodeLamps(HEADCODE_NONE, "front");
            }
            else
            {
  //            TrainzScript.Log("LMSsteam: car is end car facing in opposite direction to train");
              ConfigureHeadcodeLamps(HEADCODE_TAIL_LIGHTS, "front");
            }
            break;
  
  
          case CAR_DERAILED:
          case CAR_CENTER:
          case CAR_SINGLE:
          default:
  //          TrainzScript.Log("LMSsteam: Switching off all lights - car is center car");
              ConfigureHeadcodeLamps(HEADCODE_NONE, "front");
            break;
          
        }
      }
    }
    else
    {
//      TrainzScript.Log("Switching off all lights - no loco in train");
      ConfigureHeadcodeLamps(HEADCODE_NONE, "front");
    }
  }


  // ============================================================================
  // Name: DetermineCarPosition()
  // Desc: Determine our position in this consist
  // ============================================================================
  int DetermineCarPosition()
  {
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
    Train oldTrain = m_train;

    m_train = GetMyTrain();

    if(oldTrain)
    {
      if(oldTrain != m_train)
      {
        Sniff(oldTrain, "Train", "", false);
        Sniff(oldTrain, "SetTrainReportingNumber", "", false);
        Sniff(m_train, "Train", "", true);
        Sniff(m_train, "SetTrainReportingNumber", "", true);
      }
    }
    else
    {
      Sniff(m_train, "Train", "", true);
      Sniff(m_train, "SetTrainReportingNumber", "", true);
    }
  }


  // ============================================================================
  // Name: GetStringHeadcode()
  // Parm: int - headcode value
  // Retn: string for sending as a message to the rest of the train
  // Desc: Message handler for "Vehicle", "Derailed" messages
  // ============================================================================
  string GetStringHeadcode(int headCode)
  {
    switch (headCode)
    {
      case HEADCODE_BR1964_CLASS_0:
        return "BR1964:0Z00";
        break;
      case HEADCODE_BR1964_CLASS_1:
        return "BR1964:1Z00";
        break;
      case HEADCODE_BR1964_CLASS_2:
        return "BR1964:2Z00";
        break;
      case HEADCODE_BR1964_CLASS_3:
        return "BR1964:3Z00";
        break;
      case HEADCODE_BR1964_CLASS_4:
        return "BR1964:4Z00";
        break;
      case HEADCODE_BR1964_CLASS_5:
        return "BR1964:5Z00";
        break;
      case HEADCODE_BR1964_CLASS_6:
        return "BR1964:6Z00";
        break;
      case HEADCODE_BR1964_CLASS_7:
        return "BR1964:7Z00";
        break;
      case HEADCODE_BR1964_CLASS_8:
        return "BR1964:8Z00";
        break;
      case HEADCODE_BR1964_CLASS_9:
        return "BR1964:9Z00";
        break;
      case HEADCODE_RCH1923_CLASS_A:
        return "RCH1923:A";
        break;
      case HEADCODE_RCH1923_CLASS_B:
        return "RCH1923:B";
        break;
      case HEADCODE_RCH1923_CLASS_C:
        return "RCH1923:C";
        break;
      case HEADCODE_RCH1923_CLASS_D:
        return "RCH1923:D";
        break;
      case HEADCODE_RCH1923_CLASS_E:
        return "RCH1923:E";
        break;
      case HEADCODE_RCH1923_CLASS_F:
        return "RCH1923:F";
        break;
      case HEADCODE_RCH1923_CLASS_G:
        return "RCH1923:G";
        break;
      case HEADCODE_RCH1923_CLASS_H:
        return "RCH1923:H";
        break;
      case HEADCODE_RCH1923_CLASS_J:
        return "RCH1923:J";
        break;
      case HEADCODE_RCH1923_CLASS_K:
        return "RCH1923:K";
        break;
      case HEADCODE_ALL_LAMPS:
        return "SPECIAL:ROYALTRAIN";
        break;
      case HEADCODE_SHUNTING:
        return "SPECIAL:SHUNTING";
        break;
      case HEADCODE_TAIL_LIGHTS:
      case HEADCODE_NONE:
      default:
        return "SPECIAL:NONE";
    }
    return "SPECIAL:NONE";
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
      
      if(m_train)
      {
        Sniff(m_train, "Train", "", false);
      }
      
      m_ACSlib.LibraryCall("ACSrecalc", null, m_ACSParams);
    }
  }


  // ============================================================================
  // Name: VehicleCoupleHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Coupled" messages
  // ============================================================================
  void VehicleCoupleHandler(Message msg)
  {
    m_carPosition = DetermineCarPosition();

    // two vehicles that couple generate two couple events, one from each
    // so we can just act on ones that come from ourself
    if (msg.src == me)
    {
      m_ACSlib.LibraryCall("ACSrecalc", null, m_ACSParams);
    }

    ConfigureLights();
    
    SniffMyTrain();
  }


  // ============================================================================
  // Name: VehicleDecoupleHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Decoupled" messages
  // ============================================================================
  void VehicleDecoupleHandler(Message msg)
  {

    m_carPosition = DetermineCarPosition();

    // only one decouple event is generated for each decouple,
    // not one for each half of train, so in this case have to check anyway
    // this is still reasonably efficient, as we can at least be confident
    // the decouple happened somewhere in our train

    m_ACSlib.LibraryCall("ACSrecalc", null, m_ACSParams);
    
    ConfigureLights();
    
    SniffMyTrain();
  }


  // ============================================================================
  // Name: TrainTurnaroundHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Train", "Turnaround" messages
  // ============================================================================
  void TrainTurnaroundHandler(Message msg)
  {
    m_carPosition = DetermineCarPosition();

    ConfigureLights();
  }


  // ============================================================================
  // Name: ACSHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "ACS", "" messages
  // ============================================================================
  void ACShandler(Message msg)
  {
    // tokenise msg.minor into pipe ('|') separated strings
    string[] callback = Str.Tokens(msg.minor, "|");

    // this vehicle does not have rear mounted ACS anything!
    if (callback[1] != "front")
    {
      return;
    }

    if (callback.size() >= 3)
    {
      if(callback[0] == "coupler")
      {
        if(callback[2] == "screwlink")
        {
          SetFXAttachment("couple_" + callback[1], m_LMS_screwlink_coupled);
        }
        else
        {
          SetFXAttachment("couple_" + callback[1], m_LMS_screwlink_hanging);
        }
      }
/* This vehicle does not have gangways.
 *    else if(callback[0] == "gangway")
 *    {
 *      if(callback[2] == "gangway")
 *      {
 *        SetFXAttachment("gangway_" + callback[1], m_gangway_extended);
 *        SetMeshAnimationState("gangway_doors_" + callback[1], true);
 *      }
 *      else if(callback[2] == "rubbing-plate")
 *      {
 *        SetFXAttachment("gangway_" + callback[1], m_gangway_extended);
 *        SetMeshAnimationState("gangway_doors_" + callback[1], false);
 *      }
 *      else
 *      {
 *        SetFXAttachment("gangway_" + callback[1], m_gangway_retracted);
 *        SetMeshAnimationState("gangway_doors_" + callback[1], false);
 *      }
 *    }
 */
/* This vehicle is not air brake fitted.
 *    else if(callback[0] == "airbrake")
 *    {
 *      if(callback[2] == "twin")
 *      {
 *        if(callback[3] == "straight")
 *        {
 *          SetFXAttachment("air_" + callback[1], m_air_straight);
 *          SetFXAttachment("mainres_" + callback[1], m_mainres_straight);
 *        }
 *        else if(callback[3] == "cross")
 *        {
 *          SetFXAttachment("air_" + callback[1], m_air_cross);
 *          SetFXAttachment("mainres_" + callback[1], m_mainres_cross);
 *        }
 *      }
 *      else if(callback[2] == "single")
 *      {
 *        if(callback[3] == "straight")
 *        {
 *          SetFXAttachment("air_" + callback[1], m_air_straight);
 *        }
 *        else if(callback[3] == "cross")
 *        {
 *          SetFXAttachment("air_" + callback[1], m_air_cross);
 *        }
 *        SetFXAttachment("mainres_" + callback[1], m_mainres_disconnected);
 *      }
 *      else
 *      {
 *        SetFXAttachment("air_" + callback[1], m_air_disconnected);
 *        SetFXAttachment("mainres_" + callback[1], m_mainres_disconnected);
 *      }
 *    }
 */        
      else if(callback[0] == "vacbrake")
      {
        if(callback[2] == "single")
        {
          SetFXAttachment("vac_" + callback[1], m_LMS_vac_cross);
        }
        else if(callback[2] == "high")
        {
          SetFXAttachment("vac_" + callback[1], m_LMS_vac_high);
        }
        else
        {
          SetFXAttachment("vac_" + callback[1], m_LMS_vac_disconnected);
        }
      }
      else if(callback[0] == "multiple-working")
      {
        // no multi-working equipment on this vehicle
      }
      else if(callback[0] == "heating")
      {
        if(callback[2] == "dual" or callback[2] == "steam")
        {
          SetFXAttachment("steamheat_" + callback[1], m_LMS_steam_heat_connected);
        }
        else
        {
          SetFXAttachment("steamheat_" + callback[1], m_LMS_steam_heat_disconnected);
        }
      }
/* This vehicle does not have RCH leads.
 *    else if(callback[0] == "rch")
 *    {
 *      if(callback[2] == "staggered")
 *      {
 *        SetFXAttachment("rch_" + callback[1], m_RCH_staggered);
 *      }
 *      else if(callback[2] == "high")
 *      {
 *        SetFXAttachment("rch_" + callback[1], m_RCH_high);
 *      }
 *      else if(callback[2] == "low")
 *      {
 *        SetFXAttachment("rch_" + callback[1], m_RCH_low);
 *      }
 *      else
 *      {
 *        SetFXAttachment("rch_" + callback[1], m_RCH_disconnected);
 *      }
 *    }
 */
    }
    else
    {
      TrainzScript.Log("ERROR: ACS Library returned invalid callback \"" + msg.minor + "\" - not divisible into at least 3 parts!");
    }
  }


  // ============================================================================
  // Name: TrainReportingNumberHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "SetTrainReportingNumber", "" messages
  // ============================================================================
  void TrainReportingNumberHandler(Message msg)
  {
    // msg.minor will contain a string with a headcode standard, a colon, and a headcode string

    string[] headcodemessage = Str.Tokens(msg.minor, ":");
    
    if (headcodemessage.size() == 2)
    {
      string theCode = headcodemessage[1];
      
      if (headcodemessage[0] == "BR1964")
      {
        // BR 1964 type headcode
        if (theCode[0,1] == "1") { m_headCode = HEADCODE_BR1964_CLASS_1; }
        else if (theCode[0,1] == "2") { m_headCode = HEADCODE_BR1964_CLASS_2; }
        else if (theCode[0,1] == "3") { m_headCode = HEADCODE_BR1964_CLASS_3; }
        else if (theCode[0,1] == "4") { m_headCode = HEADCODE_BR1964_CLASS_4; }
        else if (theCode[0,1] == "5") { m_headCode = HEADCODE_BR1964_CLASS_5; }
        else if (theCode[0,1] == "6") { m_headCode = HEADCODE_BR1964_CLASS_6; }
        else if (theCode[0,1] == "7") { m_headCode = HEADCODE_BR1964_CLASS_7; }
        else if (theCode[0,1] == "8") { m_headCode = HEADCODE_BR1964_CLASS_8; }
        else if (theCode[0,1] == "9") { m_headCode = HEADCODE_BR1964_CLASS_9; }
        else if (theCode[0,1] == "0") { m_headCode = HEADCODE_BR1964_CLASS_0; }
      }
      else if (headcodemessage[0] == "RCH1923")
      {
        // RCH grouping era headcode
        if (theCode[0,1] == "A") { m_headCode = HEADCODE_RCH1923_CLASS_A; }
        else if (theCode[0,1] == "B") { m_headCode = HEADCODE_RCH1923_CLASS_B; }
        else if (theCode[0,1] == "C") { m_headCode = HEADCODE_RCH1923_CLASS_C; }
        else if (theCode[0,1] == "D") { m_headCode = HEADCODE_RCH1923_CLASS_D; }
        else if (theCode[0,1] == "E") { m_headCode = HEADCODE_RCH1923_CLASS_E; }
        else if (theCode[0,1] == "F") { m_headCode = HEADCODE_RCH1923_CLASS_F; }
        else if (theCode[0,1] == "G") { m_headCode = HEADCODE_RCH1923_CLASS_G; }
        else if (theCode[0,1] == "H") { m_headCode = HEADCODE_RCH1923_CLASS_H; }
        else if (theCode[0,1] == "J") { m_headCode = HEADCODE_RCH1923_CLASS_J; }
        else if (theCode[0,1] == "K") { m_headCode = HEADCODE_RCH1923_CLASS_K; }
      }
      else if (headcodemessage[0] == "SPECIAL")
      {
        // special codes
        if (theCode == "ROYALTRAIN") { m_headCode = HEADCODE_ALL_LAMPS; }
        else if (theCode == "SHUNTING") { m_headCode = HEADCODE_SHUNTING; }
      }
      else
      {
        TrainzScript.Log("LMSSteam> ERROR: Unsupported headcode type requested.");
        return;
      }
    }
    else
    {
      TrainzScript.Log("LMSSteam> ERROR: Invalid headcode message detected.");
    }

    m_carPosition = DetermineCarPosition();

    ConfigureLights();
  }



  
  
  // ============================================================================
  // Name: SetProperties()
  // Parm: soup - properties soup to set internal state from
  // Desc: SetProperties is called by Trainz to load script state
  // ============================================================================
  public void SetProperties(Soup soup)
  {
    inherited(soup);
    
    // load headcode
    m_headCode = soup.GetNamedTagAsInt("headcode-lamps", m_headCode);

    m_carPosition = DetermineCarPosition();
    ConfigureLights();
    
    ConfigureVehicleForNumber();
  }


  // ============================================================================
  // Name: GetProperties()
  // Retn: Soup - properties soup containing the current internal state
  // Desc: GetProperties is called by Trainz to save script state
  // ============================================================================
  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    // save headcode
    soup.SetNamedTag("headcode-lamps", m_headCode);

    return soup;
  }


  // ============================================================================
  // Name: GetDescriptionHTML()
  // Retn: string - HTML for a description pane
  // Desc: GetDescriptionHTML is 
  // ============================================================================
  public string GetDescriptionHTML(void)
  {
//    TrainzScript.Log("GetDescriptionHTML Called!");

    string html = inherited();

    // option to change headcode
    string headcodeLampStr = "<a href=live://property/headcode_lamps>" + m_strTable.GetString("headcode_lamps_" + m_headCode) + "</a>";
    html = html + "<p>" + m_strTable.GetString1("headcode_lamps_desc", headcodeLampStr) + "</p>";
    
//    TrainzScript.Log("HTML Is: " + html);

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
      return m_strTable.GetString("headcode_lamps_name");
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
      return m_strTable.GetString("headcode_lamps_description");
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
      for (i = 0; i < 24; ++i)
      {
        result[i] = m_strTable.GetString("headcode_lamps_"+i);
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
      if (p_index > -1 and p_index < 24)
      {
        m_headCode = p_index;
        PostMessage(m_train, "SetTrainReportingNumber", GetStringHeadcode(m_headCode), 0.0f);
        
        m_carPosition = DetermineCarPosition();
        
        ConfigureLights();
      }
    }
    else
    {
      inherited(p_propertyID, p_value, p_index);
    }
  }


};