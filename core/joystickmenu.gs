include "tttemenu.gs"

class JoystickMenu isclass CustomScriptMenu
{
  Browser Joystick = null;

  bool windowOpen = false;

  string GetJoystickContentHTML();

  public bool IsCore() { return true; }
  
  public string GetMenuHTML()
  {
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<img kuid='<kuid:414976:102981>' width=" + (string)TTTEBase.POPUP_WIDTH + " height=" + (string)TTTEBase.POPUP_HEIGHT + ">");
  	output.Print("</body></html>");

  	return output.AsString();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:105003>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 28;
  }

  public void ProcessMessage(string cmd)
  {

    //base.RefreshBrowser();
  }

  define int Joystick_Size = 75;
  define int HalfSize = Joystick_Size / 2;
  define float Joystick_Range = 44.0;

  public void Open()
  {
    windowOpen = true;

    int BrowserCenterX = base.popup.GetWindowLeft() + (base.popup.GetWindowWidth() / 2);
    int BrowserCenterY = base.popup.GetWindowTop() + (base.popup.GetWindowHeight() / 2);

    Joystick = Constructors.NewBrowser();

    Joystick.SetCloseEnabled(false);
    Joystick.LoadHTMLString(base.self.GetAsset(), GetJoystickContentHTML());
    //Joystick.SetWindowStyle(Browser.STYLE_NO_FRAME);
    Joystick.SetWindowStyle(Browser.STYLE_POPOVER);
    Joystick.SetWindowPriority(Browser.BP_Window); //must be called after style
    //Joystick.SetWindowStyle(Browser.STYLE_SLIM_FRAME);
    Joystick.SetMovableByDraggingBackground(true);
  	Joystick.SetWindowPosition(BrowserCenterX - HalfSize, BrowserCenterY - HalfSize);
  	Joystick.SetWindowSize(Joystick_Size, Joystick_Size);
  	Joystick.SetWindowVisible(true);
  }

  public void Close()
  {
    //clear when menu exits
    Joystick = null;
    windowOpen = false;
  }

  string GetJoystickContentHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<img kuid='<kuid:414976:104990>' width=" + (string)Joystick_Size + " height=" + (string)Joystick_Size + ">");
    output.Print("</body></html>");

    return output.AsString();
  }

  public float GetTickInterval()
  {
    return 0.01;
  }

  public void Tick()
  {
    if(Joystick == null)
      return;
    
    Joystick.BringToFront();
    int BrowserTop      = base.popup.GetWindowTop();
    int BrowserBottom   = base.popup.GetWindowBottom();
    int BrowserLeft     = base.popup.GetWindowLeft();
    int BrowserRight    = base.popup.GetWindowRight();
    int JoystickTop     = Joystick.GetWindowTop();
    int JoystickBottom  = Joystick.GetWindowBottom();
    int JoystickLeft    = Joystick.GetWindowLeft();
    int JoystickRight   = Joystick.GetWindowRight();

    //update center position
    int HalfBrowserWidth = base.popup.GetWindowWidth() / 2;
    int HalfBrowserHeight = base.popup.GetWindowHeight() / 2;

    //prevent divide by 0
    if(HalfBrowserWidth == 0 or HalfBrowserHeight == 0)
      return;
    
    int BrowserCenterX = BrowserLeft + HalfBrowserWidth;
    int BrowserCenterY = BrowserTop + HalfBrowserHeight;
    //get relative
    int CenterLeft = BrowserCenterX - HalfSize;
    int CenterTop = BrowserCenterY - HalfSize;
    int RelativeX = JoystickLeft - CenterLeft;
    int RelativeY = JoystickTop - CenterTop;

    if(JoystickLeft < BrowserLeft) Joystick.SetWindowPosition(BrowserLeft, JoystickTop);
    if(JoystickTop < BrowserTop) Joystick.SetWindowPosition(JoystickLeft, BrowserTop);
    if(JoystickRight > BrowserRight) Joystick.SetWindowPosition(BrowserRight - Joystick_Size, JoystickTop);
    if(JoystickBottom > BrowserBottom) Joystick.SetWindowPosition(JoystickLeft, BrowserBottom - Joystick_Size);

    float OffsetX = ((float)RelativeX / (float)HalfBrowserWidth);
    float OffsetY = ((float)RelativeY / (float)HalfBrowserWidth); // HalfBrowserHeight different browser dimensions
    //OffsetX = Math.Fmax(Math.Fmin(OffsetX, Joystick_Range), -Joystick_Range);
    //OffsetY = Math.Fmax(Math.Fmin(OffsetY, Joystick_Range), -Joystick_Range);
    //normalize the offset
    float length = Math.Sqrt(OffsetX * OffsetX + OffsetY * OffsetY) + 0.001; //prevent divide by zero
    if(length > 1.0)
    {
      OffsetX = OffsetX / length;
      OffsetY = OffsetY / length;
    }

    base.eyeX = (OffsetX * Joystick_Range) * Math.PI / 180;
    base.eyeY = (OffsetY * Joystick_Range) * Math.PI / 180;
  }
};