include "tttemenu.gs"
include "noise.gs"

class LocoMenu isclass CustomScriptMenu
{
  bool b_WheelslipEnabled = false;
  bool b_ShakeEnabled = false;
  bool b_ShakeAll = false;
  float b_ShakeIntensity = 0.02;
  float b_ShakePeriod = 0.04;
  float normal_maxtractiveeffort;
  float normal_traction;
  float normal_momentum;

  define int ROTATION_NONE = 0;
  define int ROTATION_JOYSTICK = 1;
  define int ROTATION_CGI = 2;
  int m_rotationMode = 0;

  Browser Joystick = null;
  define int Joystick_Size = 75;
  define int HalfSize = Joystick_Size / 2;

  int ShakeTime = 0;
  Orientation[] lastShakeTargets = new Orientation[0];
  Orientation[] shakeTargets = new Orientation[0];

  Noise m_noise = new Noise();
  float m_wobbleIntensity = 0.5;
  float m_wobbleSpeed = 0.5;
  float[] m_lastVelocity = new float[0];
  float[] m_smoothedAcceleration = new float[0];

  void CreateJoystick();
  void UpdateJoystick();
  void UpdateCGIConsist(float timestep);
  void UpdateCGITraincar(Vehicle traincar, int seed, float velocity, float acceleration);

  public bool IsCore() { return true; }
  
  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
  	output.Print("<table>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-wheelslip", b_WheelslipEnabled));
    output.Print(" " + base.strTable.GetString("wheelslip"));
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-shake", b_ShakeEnabled));
    output.Print(" " + base.strTable.GetString("shake"));
    if(b_ShakeEnabled)
    {
      output.Print("<br>");
      output.Print(base.strTable.GetString("shake_intensity"));
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='shakeintensity' min=0.0 max=0.02 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print(base.strTable.GetString("shake_period"));
      output.Print("<trainz-object style=edit-box link-on-focus-loss id=shakeperiod width=60 height=16></trainz-object>");

      output.Print("<br>");
      output.Print(HTMLWindow.CheckBox("live://property/loco-shake-all", b_ShakeAll));
      output.Print(" " + base.strTable.GetString("shake_all"));
    }
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-couple", base.b_CoupleLockEnabled));
    output.Print(" " + base.strTable.GetString("couple_disable"));
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print("Rotation Method:<br>");

    if (m_rotationMode != ROTATION_NONE) output.Print("<a href='live://property/rotation-none'>");
    output.Print("None");
    if (m_rotationMode != ROTATION_NONE) output.Print("</a>");
    output.Print("<br>");

    if (m_rotationMode != ROTATION_JOYSTICK) output.Print("<a href='live://property/rotation-joystick'>");
    output.Print("Joystick");
    if (m_rotationMode != ROTATION_JOYSTICK) output.Print("</a>");
    output.Print("<br>");

    if (m_rotationMode != ROTATION_CGI) output.Print("<a href='live://property/rotation-cgi'>");
    output.Print("CGI");
    if (m_rotationMode != ROTATION_CGI) output.Print("</a>");
    output.Print("<br>");

    output.Print("</td></tr>");

    if (m_rotationMode == ROTATION_JOYSTICK)
    {
      output.Print("<tr><td>");
      output.Print("Loco Rotation:<br>");
      output.Print("<img kuid='<kuid:414976:102981>' width=" + (string)TTTEBase.POPUP_WIDTH + " height=" + (string)TTTEBase.POPUP_WIDTH + ">");
      output.Print("</td></tr>");
    }
    else if (m_rotationMode == ROTATION_CGI)
    {
      output.Print("<tr><td>");
      output.Print("Wobble Intensity:<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='wobbleintensity' min=0.0 max=1.0 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print("Wobble Speed:<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='wobblespeed' min=0.0 max=1.0 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print("</td></tr>");
    }

    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    return "<kuid:414976:103611>";
  }

  public float GetTickInterval()
  {
    return 0.01;
  }

  public bool AlwaysTick()
  {
    return true;
  }

  string GetJoystickContentHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<img kuid='<kuid:414976:104990>' width=" + (string)Joystick_Size + " height=" + (string)Joystick_Size + ">");
    output.Print("</body></html>");

    return output.AsString();
  }

  public void Open()
  {
    m_noise.Init();
    m_lastVelocity = new float[0];
    m_smoothedAcceleration = new float[0];

    if (m_rotationMode == ROTATION_JOYSTICK)
      CreateJoystick();
  }

  public void PostRefresh()
  {
    base.popup.SetElementProperty("shakeintensity", "value", (string)b_ShakeIntensity);
    base.popup.SetElementProperty("shakeperiod", "text", (string)b_ShakePeriod);
    base.popup.SetElementProperty("wobbleintensity", "value", (string)m_wobbleIntensity);
    base.popup.SetElementProperty("wobblespeed", "value", (string)m_wobbleSpeed);
  }

  float Lerp(float from, float to, float t)
	{
		return (from + (to - from)*t);
	}

  Orientation Lerp(Orientation a, Orientation b, float t)
  {
    Orientation x = new Orientation();
    x.rx = Lerp(a.rx, b.rx, t);
    x.ry = Lerp(a.ry, b.ry, t);
    x.rz = Lerp(a.rz, b.rz, t);
    return x;
  }

  public void Tick()
  {
    // delete the joystick if it's no longer necessary
    if (m_rotationMode != ROTATION_JOYSTICK and Joystick)
      Joystick = null;

    if (m_rotationMode != ROTATION_NONE)
    {
      if (m_rotationMode == ROTATION_JOYSTICK)
      {
        if (!Joystick)
          CreateJoystick();
        
        UpdateJoystick();
      }
      else if (m_rotationMode == ROTATION_CGI)
      {
        if(base.CurrentMenu == me)
        {
          m_wobbleIntensity = Str.ToFloat(base.popup.GetElementProperty("wobbleintensity", "value"));
          m_wobbleSpeed = Str.ToFloat(base.popup.GetElementProperty("wobblespeed", "value"));
        }

        UpdateCGIConsist(GetTickInterval());
      }
    }
    else if(b_ShakeEnabled)
    {
      if(base.CurrentMenu == me)
      {
        b_ShakeIntensity = Str.UnpackFloat(base.popup.GetElementProperty("shakeintensity", "value"));
        b_ShakePeriod = Str.UnpackFloat(base.popup.GetElementProperty("shakeperiod", "text")); //seconds to tenths
      }

      //prevent divide by zero
      int localPeriod = (b_ShakePeriod * 100.0);
      if(localPeriod < 2) localPeriod = 2;

      float along = (float)ShakeTime / (float)localPeriod;

      Vehicle[] vehicles;

      if(!b_ShakeAll)
      {
        vehicles = new Vehicle[1];
        vehicles[0] = base.self;
      }
      else
      {
        vehicles = base.self.GetMyTrain().GetVehicles();
      }

      int i;
      for(i = 0; i < vehicles.size(); i++)
      {
        if(i >= lastShakeTargets.size())
          lastShakeTargets[i] = new Orientation();
        if(i >= shakeTargets.size())
          shakeTargets[i] = new Orientation();

        Orientation target = Lerp(lastShakeTargets[i], shakeTargets[i], along);
        vehicles[i].SetMeshOrientation("default", target.rx, target.ry, target.rz);

        if(ShakeTime == localPeriod)
        {
          lastShakeTargets[i] = shakeTargets[i];

          Orientation newTarget = new Orientation();
          newTarget.rx = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
          newTarget.ry = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
          newTarget.rz = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
          shakeTargets[i] = newTarget;
        }
      }

      if(ShakeTime == localPeriod)
        ShakeTime = 0;

      ShakeTime++;
    }

    if(base.CurrentMenu != me and !b_ShakeEnabled and m_rotationMode != ROTATION_CGI)
    {
      //stop ticking if we're running in the background and shake is disabled
      Joystick = null;
      StopTick();
    }
  }

  public void ProcessMessage(string cmd)
  {
    if(cmd == "live://property/loco-wheelslip")
    {
      b_WheelslipEnabled = !b_WheelslipEnabled;
      if(b_WheelslipEnabled)
      {
        normal_maxtractiveeffort = base.self.GetMaximumTractiveEffort();
        normal_traction = base.self.GetWheelslipTractionMultiplier();
        normal_momentum = base.self.GetWheelslipMomentumMultiplier();

        base.self.SetMaximumTractiveEffort(0.01);
        base.self.SetWheelslipTractionMultiplier(1.0);
        base.self.SetWheelslipMomentumMultiplier(0.1);
      }
      else
      {
        base.self.SetMaximumTractiveEffort(normal_maxtractiveeffort);
        base.self.SetWheelslipTractionMultiplier(normal_traction);
        base.self.SetWheelslipMomentumMultiplier(normal_momentum);
      }
    }
    else if(cmd == "live://property/loco-shake")
    {
      b_ShakeEnabled = !b_ShakeEnabled;
      if(!b_ShakeEnabled)
        base.self.SetMeshOrientation("default", 0.0, 0.0, 0.0);
    }
    else if(cmd == "live://property/loco-shake-all")
    {
      b_ShakeAll = !b_ShakeAll;
      if(!b_ShakeAll)
      {
        Vehicle[] vehicles = base.self.GetMyTrain().GetVehicles();
        int i;
        for(i = 0; i < vehicles.size(); i++)
          vehicles[i].SetMeshOrientation("default", 0.0, 0.0, 0.0);
      }
    }
    else if(cmd == "live://property/loco-couple")
    {
      base.b_CoupleLockEnabled = !base.b_CoupleLockEnabled;
    }
    else if(cmd == "live://property/rotation-none")
    {
      m_rotationMode = ROTATION_NONE;
    }
    else if(cmd == "live://property/rotation-joystick")
    {
      m_rotationMode = ROTATION_JOYSTICK;
    }
    else if(cmd == "live://property/rotation-cgi")
    {
      m_rotationMode = ROTATION_CGI;
    }

    base.RefreshBrowser();
  }

  void CreateJoystick()
  {
    int joystickPosX = base.popup.GetWindowLeft() + (base.popup.GetWindowWidth() / 2);
    int joystickPosY = base.popup.GetWindowBottom() - TTTEBase.POPUP_WIDTH / 2;

    Joystick = Constructors.NewBrowser();

    Joystick.SetCloseEnabled(false);
    Joystick.LoadHTMLString(base.self.GetAsset(), GetJoystickContentHTML());
    Joystick.SetWindowStyle(Browser.STYLE_POPOVER);
    Joystick.SetWindowPriority(Browser.BP_Window); //must be called after style
    Joystick.SetMovableByDraggingBackground(true);
  	Joystick.SetWindowPosition(joystickPosX - HalfSize, joystickPosY - HalfSize);
  	Joystick.SetWindowSize(Joystick_Size, Joystick_Size);
  	Joystick.SetWindowVisible(true);
  }

  void UpdateJoystick()
  {      
    if(Joystick == null)
      return;
  
    Joystick.BringToFront();
    // constrain to joystick box
    int BrowserTop      = base.popup.GetWindowBottom() - TTTEBase.POPUP_WIDTH;
    int BrowserBottom   = base.popup.GetWindowBottom();
    int BrowserLeft     = base.popup.GetWindowLeft();
    int BrowserRight    = base.popup.GetWindowRight();
    int JoystickTop     = Joystick.GetWindowTop();
    int JoystickBottom  = Joystick.GetWindowBottom();
    int JoystickLeft    = Joystick.GetWindowLeft();
    int JoystickRight   = Joystick.GetWindowRight();

    //update center position
    int HalfBrowserWidth = base.popup.GetWindowWidth() / 2;

    //prevent divide by 0
    if(HalfBrowserWidth == 0)
      return;
    
    int joystickCenterX = base.popup.GetWindowLeft() + (base.popup.GetWindowWidth() / 2);
    int joystickCenterY = base.popup.GetWindowBottom() - TTTEBase.POPUP_WIDTH / 2;

    //get relative
    int CenterLeft = joystickCenterX - HalfSize;
    int CenterTop = joystickCenterY - HalfSize;
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

    float max_rotation = 8;

    Vehicle loco = base.self;
    loco.SetMeshOrientation("default", OffsetY * max_rotation * Math.PI / 180, 0, OffsetX * max_rotation * Math.PI / 180);
  }

  float smoothstep(float x, float edge0, float edge1)
  {
    // Scale, and clamp x to 0..1 range
    x = (x - edge0) / (edge1 - edge0);
    if (x < 0) x = 0;
    if (x > 1) x = 1;
 
    return x * x * (3.0f - 2.0f * x);
  }

  float remap(float a, float b, float c, float d, float t)
  {
    float m1 = smoothstep(t, a, b);
    float m2 = smoothstep(t, d, c);

    return m1 * m2;
  }

  bool wasStopped = false;

  void UpdateCGIConsist(float timestep)
  {
    Vehicle[] vehicles = base.self.GetMyTrain().GetVehicles();

    // float trainVelocity = base.self.GetMyTrain().GetSmoothedVelocity();
    
    int i;
    for(i = 0; i < vehicles.size(); i++)
    {
      Vehicle traincar = vehicles[i];

      // prevent a jolt when we start
      if (i >= m_lastVelocity.size() or wasStopped)
        m_lastVelocity[i] = traincar.GetVelocity();
      
      float acceleration = (traincar.GetVelocity() - m_lastVelocity[i]) / timestep;

      if (traincar != base.self)
        acceleration = acceleration * -1;
      
      float max_change = 3.0;
      if (acceleration > max_change)
        acceleration = max_change;
      if (acceleration < -max_change)
        acceleration = -max_change;
      
      // dim the pitch change based on our velocity
      // float velocity_dim = remap(0.0, 2.0, 3.0, 7.0, Math.Abs(traincar.GetVelocity()));
      float velocity_dim = smoothstep(Math.Abs(traincar.GetVelocity()), 6, 1);
      acceleration = acceleration * velocity_dim * velocity_dim;

      if (i >= m_smoothedAcceleration.size())
        m_smoothedAcceleration[i] = acceleration;
      
      m_smoothedAcceleration[i] = m_smoothedAcceleration[i] + (acceleration - m_smoothedAcceleration[i]) * 0.01;

      // float jerk = (acceleration - m_lastAcceleration[i]) / timestep;

      UpdateCGITraincar(traincar, i, traincar.GetVelocity(), m_smoothedAcceleration[i]);
      m_lastVelocity[i] = traincar.GetVelocity();

      // m_lastAcceleration[i] = acceleration;
    }

    wasStopped = base.self.GetMyTrain().IsStopped();
  }

  void UpdateCGITraincar(Vehicle traincar, int seed, float velocity, float acceleration)
  {
    float time = World.GetSeconds();
    Orientation target = new Orientation();

    
    float noise_period = (1 - m_wobbleSpeed + 0.1);
    float rotation_strength = 0.1 * m_wobbleIntensity * velocity;

    // wobble curve
    target.rx = (m_noise.turbulence_noise(noise_period, time, seed * 1000 + 000, 0.1, 0) - 0.5) * 2 * (rotation_strength * Math.PI / 180);
    target.ry = (m_noise.turbulence_noise(noise_period, time, seed * 1000 + 100, 0.1, 0) - 0.5) * 2 * (rotation_strength * Math.PI / 180);
    target.rz = (m_noise.turbulence_noise(noise_period, time, seed * 1000 + 200, 0.1, 0) - 0.5) * 2 * (rotation_strength * Math.PI / 180);

    // acceleration pitch
    target.rx = target.rx + (acceleration * 0.8 * Math.PI / 180);
    // TrainzScript.Log("accel " + (string)acceleration);

    traincar.SetMeshOrientation("default", target.rx, target.ry, target.rz);
  }
};