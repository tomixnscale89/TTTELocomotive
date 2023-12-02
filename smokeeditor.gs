// ============================================================================
// TTTELocmotive.gs
// Desc: Script designed to make Thomas models more simple for Trainz.
// Key features of this script are:
// Replaceable faces with the capabilities of a smokebox door.
// Eye script from Rileyzzz
// ============================================================================
// Should work in all Trainz versions.
// This script is provided as is and people are welcome to publish updates. The source will be available on github.
// ============================================================================
// Authors:
// GDennish (Tomix)
// Rileyzzz
// ============================================================================

include "locomotive.gs"
include	"meshobject.gs"
include "interface.gs"
include "orientation.gs"
include "multiplayergame.gs"
include "soup.gs"
// ============================================================================
// Style of code:
// Use lmssteam for reference until our code is strong enough to use on it's own.
// ============================================================================

// ============================================================================
// TO DO:
// 1. Update all eyescript code to reflect the latest version on github.
// 2. Begin implementing a GUI for the Lamps, and make the interface overall a bit more pretty.
// ============================================================================



// ============================================================================
// Name: tttelocomotive
// Desc: Script class for a generic TTTE Locomotive
// ============================================================================

class smokeeditor isclass Locomotive
{
   // ****************************************************************************/
  // Define Functions
  // ****************************************************************************/
  void SniffMyTrain(void);
  void SetNamedFloatFromExisting(Soup in, Soup out, string tagName);
  bool SoupHasTag(Soup testSoup, string tagName);

  void createMenuWindow();
  thread void BrowserThread();
  thread void ScanBrowser(void);

  bool m_cameraViewpoint; // Current Camera point
  bool m_cameraTarget; // Is this the camera target?

  bool m_trainzModule;

  float trainzVersion = World.GetTrainzVersion();


  Soup myConfig;

  Soup SmokeEdits;

  //Browser interface
  Browser browser;
  define int BROWSER_MAINMENU = 0;
  define int BROWSER_SMOKEMENU = 1;

  int CurrentMenu = BROWSER_MAINMENU;
  bool HasFocus = false;
  bool BrowserClosed;

  public define int CAR_DERAILED = -1;
  public define int CAR_CENTER   =  0;
  public define int CAR_FRONT    =  1;
  public define int CAR_BACK     =  2;
  public define int CAR_SINGLE   =  3; // CAR_FRONT + CAR_BACK == CAR_SINGLE. Yes, this is intentional.

  int m_carPosition; // position of car in train - one of the options above

  Train train;

  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init() // Let's keep the init at the top for ease of access
  {
  inherited();

  myConfig = me.GetAsset().GetConfigSoup();

  SmokeEdits = Constructors.NewSoup();
  int ParticleCount = 0;
  int curTag;
  for(curTag = 0; curTag < myConfig.CountTags(); curTag++)
  {
    string tagName = myConfig.GetIndexedTagName(curTag);
    if(TrainUtil.HasPrefix(tagName, "smoke"))
    {
      Soup curSmoke = myConfig.GetNamedSoup(tagName);

      Soup NewContainer = Constructors.NewSoup();
      NewContainer.SetNamedTag("active", false); //whether to override
      NewContainer.SetNamedTag("expanded", false);
      SetNamedFloatFromExisting(curSmoke, NewContainer, "rate");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "velocity");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "lifetime");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "minsize");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "maxsize");

      TrainzScript.Log(NewContainer.AsString());
      SmokeEdits.SetNamedSoup((string)ParticleCount, NewContainer);
      ParticleCount++;
    }
  }

  createMenuWindow();
  ScanBrowser();
  BrowserThread();


	train = me.GetMyTrain(); // Get the train
	SniffMyTrain(); // Then sniff it

  }

  // ============================================================================
  // Name: SetNamedFloatFromExisting()
  // Desc: Utility for copying soups.
  // ============================================================================
  void SetNamedFloatFromExisting(Soup in, Soup out, string tagName)
  {
    if(in.GetIndexForNamedTag(tagName) != -1) out.SetNamedTag(tagName, Str.UnpackFloat(in.GetNamedTag(tagName)));
  }

  // ============================================================================
  // Name: SoupHasTag()
  // Desc: Determine if a Soup contains a tag.
  // ============================================================================
  bool SoupHasTag(Soup testSoup, string tagName)
  {
    if(testSoup.GetIndexForNamedTag(tagName) == -1)
    {
      return false;
    }
    //return false if it doesnt exist, otherwise return true
    return true;
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
  // Name: UpdateSmoke()
  // Desc: Update all smoke values.
  // ============================================================================
  void UpdateSmoke()
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
          if(curTagName == "rate") SetPFXEmitterRate(i, phase, value);
          if(curTagName == "velocity") SetPFXEmitterVelocity(i, phase, value);
          if(curTagName == "lifetime") SetPFXEmitterLifetime(i, phase, value);
          if(curTagName == "minsize") SetPFXEmitterMinSize(i, phase, value);
          if(curTagName == "maxsize") SetPFXEmitterMaxSize(i, phase, value);

        }
      }
    }
  }

  // ============================================================================
  // Name: RefreshSmokeTags()
  // Desc: Updates all smoke sliders.
  // ============================================================================

  void RefreshSmokeTags()
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
          string id = (string)i + curTagName;
          browser.SetElementProperty(id, "value", (string)CurrentSmoke.GetNamedTagAsFloat(curTagName));
        }
      }
    }
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
    output.Print("<table cellspacing=5>");
    //smoke window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_smoke'>Smoke Editor</a>");
    output.Print("</td></tr>");

    output.Print("</table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }


  string GetSmokeWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<table>");

    output.Print("<tr><td>");
    output.Print("<a href='live://return' tooltip='Return to the main tab selection'><b><font>Menu</font></b></a>");
    output.Print("</td></tr>");

    //Generate smoke containers
    int i;
    for(i = 0; i < SmokeEdits.CountTags(); i++)
    {
      Soup CurrentSmoke = SmokeEdits.GetNamedSoup((string)i);
      output.Print("<tr><td>");
      output.Print("<b>");
      output.Print("smoke" + (string)i + " ");
      output.Print("</b>");

      if(CurrentSmoke.GetNamedTagAsBool("expanded")) output.Print("<a href='live://contract/" + (string)i + "'>-</a>");
      else output.Print("<a href='live://expand/" + (string)i + "'>+</a>");

      output.Print("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

      output.Print("</b>");
      output.Print("<br>");
      if(CurrentSmoke.GetNamedTagAsBool("expanded"))
      {
        output.Print("<table>");
        int curProperty;
        for(curProperty = 0; curProperty < CurrentSmoke.CountTags(); curProperty++)
        {
          string curTagName = CurrentSmoke.GetIndexedTagName(curProperty);
          if(curTagName != "active" and curTagName != "expanded")
          {
            output.Print("<tr><td>");
            output.Print(curTagName);
            output.Print("<br>");
            output.Print("<a href='live://smoke-update/" + (string)i + curTagName + "'>");
            output.Print("<trainz-object style=slider horizontal theme=standard-slider width=200 height=16 id='" + (string)i + curTagName + "' min=0.0 max=50.0 value=0.0 page-size=0.1 draw-marks=0 draw-lines=0></trainz-object>");
            output.Print("</a>");
            output.Print("<br>");
            output.Print("<trainz-text id='" + (string)i + curTagName + "-text" + "' text='" + (string)CurrentSmoke.GetNamedTagAsFloat(curTagName) + "'></trainz-text>");
            output.Print("<br>");
            output.Print("</td></tr>");
          }
        }
        output.Print("</table>");
      }
      output.Print("</td></tr>");
    }

    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }

  // ============================================================================
  // Name: createMenuWindow()
  // Desc: Creates the browser.
  // ============================================================================

  void createMenuWindow()
  {
    browser = null;
    if ( !browser )	browser = Constructors.NewBrowser();
    browser.SetCloseEnabled(true);
  	browser.SetWindowPosition(Interface.GetDisplayWidth()-450, Interface.GetDisplayHeight() - 625);
  	browser.SetWindowSize(300, 350);
  	browser.SetWindowVisible(true);
  	browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    BrowserClosed = false;
  }

  // ============================================================================
  // Name: RefreshBrowser()
  // Desc: Updates all browser parameters by reloading the HTML strings.
  // ============================================================================

  void RefreshBrowser()
  {
    switch(CurrentMenu)
    {
      case BROWSER_MAINMENU:
      browser.LoadHTMLString(GetAsset(), GetMenuHTML());
      break;
      case BROWSER_SMOKEMENU:
      browser.LoadHTMLString(GetAsset(), GetSmokeWindowHTML());
      RefreshSmokeTags();
      break;
      default:
      browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    }
  }

  // ============================================================================
  // Name: BrowserThread()
  // Desc: Recreates the browser if it is closed. (should be swapped for a module change handler)
  // ============================================================================

  thread void BrowserThread()
  {
    while(true)
    {
      if (!HasFocus)
      {
        CurrentMenu = BROWSER_MAINMENU;
        browser = null;
        BrowserClosed = true;
      }
      if (HasFocus and BrowserClosed)
      {
        //replace this with keybind
        createMenuWindow();
        BrowserClosed = false;
      }

      Sleep(0.1);
    }
  }

  // ============================================================================
  // Name: ScanBrowser()
  // Desc: Handles all browser input.
  // ============================================================================

  thread void ScanBrowser() {
		Message msg;
		wait(){

      //Smoke Window
      on "Browser-URL", "live://open_smoke", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_SMOKEMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Main Window
      on "Browser-URL", "live://return", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_MAINMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //other messages
      on "Browser-URL", "", msg:
      if ( browser and msg.src == browser )
      {

        if(TrainUtil.HasPrefix(msg.minor, "live://smoke-update/"))
        {
          string command = msg.minor;
          Str.TrimLeft(command, "live://smoke-update/");
          if(command)
          {
            //unpackint removes the integer from the original string
            string[] propertytokens = Str.Tokens(command, "0123456789");
            string propertyname = propertytokens[propertytokens.size() - 1];
            string smokeid = Str.UnpackInt(Str.CloneString(command));
            Soup smoke = SmokeEdits.GetNamedSoup(smokeid);

            float value = Str.ToFloat(browser.GetElementProperty(command, "value"));

            smoke.SetNamedTag(propertyname, value);

            browser.SetTrainzText(command + "-text", (string)value);

            RefreshSmokeTags();
            UpdateSmoke();
          }
        }
       if(TrainUtil.HasPrefix(msg.minor, "live://contract/"))
       {
         string command = Str.Tokens(msg.minor, "live://contract/")[0];
         if(command)
         {
           Soup smoke = SmokeEdits.GetNamedSoup(command);
           smoke.SetNamedTag("expanded", false);
           RefreshBrowser();
         }
       }
       if(TrainUtil.HasPrefix(msg.minor, "live://expand/"))
        {
          string command = Str.Tokens(msg.minor, "live://expand/")[0];
          if(command)
          {
            Soup smoke = SmokeEdits.GetNamedSoup(command);
            smoke.SetNamedTag("expanded", true);
            RefreshBrowser();
          }
        }
      }
      msg.src = null;
      continue;

      on "Browser-Closed", "", msg:
      {
      if ( browser and msg.src == browser ) browser = null;
        //BrowserClosed = true;
      }
      msg.src = null;
      continue;
      on "Camera","Target-Changed", msg:
      {
        if(msg.src == me) HasFocus = true;
        else HasFocus = false;
      }
      msg.src = null;
      continue;

      Sleep(0.5);
		}
	}



};
