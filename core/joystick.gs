include "Browser.gs"

class Joystick
{
  int m_size;
  int m_halfSize;
  Browser joystick;

  public float OffsetX;
  public float OffsetY;

  public void Init(int joystickSize)
  {
    m_size = joystickSize;
    m_halfSize = joystickSize / 2;
  }

  string GetJoystickContentHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<img kuid='<kuid:414976:104990>' width=" + (string)m_size + " height=" + (string)m_size + ">");
    output.Print("</body></html>");
    return output.AsString();
  }

  public void Create(Asset asset, int joystickPosX, int joystickPosY)
  {
    joystick = Constructors.NewBrowser();

    joystick.SetCloseEnabled(false);
    joystick.LoadHTMLString(asset, GetJoystickContentHTML());
    joystick.SetWindowStyle(Browser.STYLE_POPOVER);
    joystick.SetWindowPriority(Browser.BP_Window); //must be called after style
    joystick.SetMovableByDraggingBackground(true);
  	joystick.SetWindowPosition(joystickPosX - m_halfSize, joystickPosY - m_halfSize);
  	joystick.SetWindowSize(m_size, m_size);
  	joystick.SetWindowVisible(true);
  }

  public bool IsOpen()
  {
    return joystick != null;
  }

  public void Close()
  {
    joystick = null;
  }

  public void Update(int top, int bottom, int left, int right)
  {
    if(joystick == null)
      return;
  
    joystick.BringToFront();

    // constrain to joystick box
    int JoystickTop     = joystick.GetWindowTop();
    int JoystickBottom  = joystick.GetWindowBottom();
    int JoystickLeft    = joystick.GetWindowLeft();
    int JoystickRight   = joystick.GetWindowRight();

    //update center position
    int HalfBrowserWidth = (right - left) / 2;

    //prevent divide by 0
    if(HalfBrowserWidth == 0)
      return;
    
    int joystickCenterX = (left + right) / 2;
    int joystickCenterY = (top + bottom) / 2;

    //get relative
    int CenterLeft = joystickCenterX - m_halfSize;
    int CenterTop = joystickCenterY - m_halfSize;
    int RelativeX = JoystickLeft - CenterLeft;
    int RelativeY = JoystickTop - CenterTop;

    if(JoystickLeft < left) joystick.SetWindowPosition(left, JoystickTop);
    if(JoystickTop < top) joystick.SetWindowPosition(JoystickLeft, top);
    if(JoystickRight > right) joystick.SetWindowPosition(right - m_size, JoystickTop);
    if(JoystickBottom > bottom) joystick.SetWindowPosition(JoystickLeft, bottom - m_size);

    OffsetX = ((float)RelativeX / (float)HalfBrowserWidth);
    OffsetY = ((float)RelativeY / (float)HalfBrowserWidth); // HalfBrowserHeight different browser dimensions

    //OffsetX = Math.Fmax(Math.Fmin(OffsetX, Joystick_Range), -Joystick_Range);
    //OffsetY = Math.Fmax(Math.Fmin(OffsetY, Joystick_Range), -Joystick_Range);
    //normalize the offset
    float length = Math.Sqrt(OffsetX * OffsetX + OffsetY * OffsetY) + 0.001; //prevent divide by zero
    if(length > 1.0)
    {
      OffsetX = OffsetX / length;
      OffsetY = OffsetY / length;
    }
  }


};