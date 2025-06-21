include "tttemenu.gs"
include "noise.gs"
include "joystick.gs"

class LocoMenu isclass CustomScriptMenu
{
  bool b_WheelslipEnabled = false;
  bool b_BrakesBroken = false;
  bool b_ShakeEnabled = false;
  bool b_ShakeAll = false;
  bool b_UseSmoothedPitchVelocity = false;
  bool b_UseConstantPitchVelocity = false;
  float b_ShakeIntensity = 0.02;
  float b_ShakePeriod = 0.04;
  float normal_maxtractiveeffort;
  float normal_traction;
  float normal_momentum;

  define int ROTATION_NONE = 0;
  define int ROTATION_JOYSTICK = 1;
  define int ROTATION_CGI = 2;
  int m_rotationMode = 0;

  Joystick Joystick = new Joystick();

  int ShakeTime = 0;
  Orientation[] lastShakeTargets = new Orientation[0];
  Orientation[] shakeTargets = new Orientation[0];

  Noise m_noise = new Noise();
  float m_wobbleIntensity = 0.5;
  float m_wobbleSpeed = 0.5;
  float m_pitchIntensity = 0.5;
  float[] m_lastVelocity = new float[0];
  float[] m_smoothedAcceleration = new float[0];

  void CreateJoystick();
  void UpdateJoystick();
  void UpdateCGIConsist(float timestep);
  void UpdateCGITraincar(Vehicle traincar, int seed, float velocity, float pitchFactor);

  public bool IsCore() { return true; }
  
  public bool SupportsCGIRotation()
  {
    if (World.GetTrainzVersion() >= 5.1)
    {
      return true;
    }
    // pitching based on velocity is broken in old versions.
    return false;
  }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
  	output.Print("<table>");

    output.Print("<tr><td>");
    output.Print(base.LabeledCheckbox("live://property/loco-wheelslip", b_WheelslipEnabled, base.strTable.GetString("wheelslip")));
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print(base.LabeledCheckbox("live://property/loco-shake", b_ShakeEnabled, base.strTable.GetString("shake")));
    if(b_ShakeEnabled)
    {
      output.Print("<br>");
      output.Print("<label>" + base.strTable.GetString("shake_intensity") + "</label>");
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='shakeintensity' min=0.0 max=0.02 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print("<label>" + base.strTable.GetString("shake_period") + "</label>");
      output.Print("<br>");
      output.Print("<trainz-object style=edit-box link-on-focus-loss id=shakeperiod width=60 height=16></trainz-object>");

      output.Print("<br>");
      output.Print(base.LabeledCheckbox("live://property/loco-shake-all", b_ShakeAll, base.strTable.GetString("shake_all")));
    }
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print(base.LabeledCheckbox("live://property/loco-couple", base.b_CoupleLockEnabled, base.strTable.GetString("couple_disable")));
    output.Print("</td></tr>");

    // output.Print("<tr><td>");
    // output.Print(HTMLWindow.CheckBox("live://property/brakes-broken", b_BrakesBroken));
    // output.Print(" Brakes Broken");
    // output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print("<h3>Rotation Method:</h3><br>");

    output.Print(base.LabeledRadio("live://property/rotation-none", m_rotationMode == ROTATION_NONE, "None"));
    output.Print("<br>");
    output.Print(base.LabeledRadio("live://property/rotation-joystick", m_rotationMode == ROTATION_JOYSTICK, "Joystick"));
    output.Print("<br>");
    output.Print(base.LabeledRadio("live://property/rotation-cgi", m_rotationMode == ROTATION_CGI, "CGI (TRS22+ Only)"));
    output.Print("<br>");

    output.Print("</td></tr>");

    if (m_rotationMode == ROTATION_JOYSTICK)
    {
      output.Print("<tr><td>");
      output.Print("<label>Loco Rotation:</label><br>");
      output.Print("<img kuid='<kuid:414976:102981>' width=" + (string)TTTEBase.POPUP_WIDTH + " height=" + (string)TTTEBase.POPUP_WIDTH + ">");
      output.Print("</td></tr>");
    }
    else if (m_rotationMode == ROTATION_CGI)
    {
      if (SupportsCGIRotation())
      {
        output.Print("<tr><td>");
        output.Print(base.LabeledCheckbox("live://property/use-smoothed-pitch-velocity", b_UseSmoothedPitchVelocity, "Use Smoothed Pitch Velocity"));
        output.Print("</td></tr>");
  
        output.Print("<tr><td>");
        output.Print(base.LabeledCheckbox("live://property/use-constant-pitch-velocity", b_UseConstantPitchVelocity, "Use Constant Pitch Velocity"));
        output.Print("</td></tr>");
  
        
  
        output.Print("<tr><td>");
        output.Print("<label>Wobble Intensity:</label><br>");
        output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='wobbleintensity' min=0.0 max=1.0 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("<br>");
        output.Print("<label>Wobble Speed:</label><br>");
        output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='wobblespeed' min=0.0 max=1.0 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("<br>");
        output.Print("<label>Pitch Intensity:</label><br>");
        output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='pitchintensity' min=0.0 max=1.0 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("<br>");
        output.Print("</td></tr>");
      }
      else
      {
        output.Print("<tr><td>");
        output.Print("</td></tr>");
      }
    }

    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:103611>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 11;
  }

  public float GetTickInterval()
  {
    return 0.01;
  }

  public bool AlwaysTick()
  {
    return true;
  }


  public void Open()
  {
    m_noise.Init();
    Joystick.Init(75);
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
    base.popup.SetElementProperty("pitchintensity", "value", (string)m_pitchIntensity);
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
    if (m_rotationMode != ROTATION_JOYSTICK and Joystick.IsOpen())
      Joystick.Close();

    if (m_rotationMode != ROTATION_NONE)
    {
      if (m_rotationMode == ROTATION_JOYSTICK)
      {
        if (!Joystick.IsOpen())
          CreateJoystick();
        
        UpdateJoystick();
      }
      else if (m_rotationMode == ROTATION_CGI)
      {
        if(base.CurrentMenu == me)
        {
          m_wobbleIntensity = Str.ToFloat(base.popup.GetElementProperty("wobbleintensity", "value"));
          m_wobbleSpeed = Str.ToFloat(base.popup.GetElementProperty("wobblespeed", "value"));
          m_pitchIntensity = Str.ToFloat(base.popup.GetElementProperty("pitchintensity", "value"));
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
      Joystick.Close();
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
    else if(cmd == "live://property/brakes-broken")
    {
      b_BrakesBroken = !b_BrakesBroken;
      base.self.SetBrokenBrakes(b_BrakesBroken);
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
    else if(cmd == "live://property/use-smoothed-pitch-velocity")
    {
      b_UseSmoothedPitchVelocity = !b_UseSmoothedPitchVelocity;
      b_UseConstantPitchVelocity = false;
    }
    else if(cmd == "live://property/use-constant-pitch-velocity")
    {
      b_UseConstantPitchVelocity = !b_UseConstantPitchVelocity;
      b_UseSmoothedPitchVelocity = false;
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
      if (SupportsCGIRotation())
      {
        m_rotationMode = ROTATION_CGI;
      }
    }

    base.RefreshBrowser();
  }

  void CreateJoystick()
  {
    int joystickPosX = base.popup.GetWindowLeft() + (base.popup.GetWindowWidth() / 2);
    int joystickPosY = base.popup.GetWindowBottom() - TTTEBase.POPUP_WIDTH / 2;

    
    Joystick.Create(base.self.GetAsset(), joystickPosX, joystickPosY);
  }

  void UpdateJoystick()
  {
    int BrowserTop      = base.popup.GetWindowBottom() - TTTEBase.POPUP_WIDTH;
    int BrowserBottom   = base.popup.GetWindowBottom();
    int BrowserLeft     = base.popup.GetWindowLeft();
    int BrowserRight    = base.popup.GetWindowRight();
    Joystick.Update(BrowserTop, BrowserBottom, BrowserLeft, BrowserRight);

    float max_rotation = 8;

    Vehicle loco = base.self;
    loco.SetMeshOrientation("default", Joystick.OffsetY * max_rotation * Math.PI / 180, 0, Joystick.OffsetX * max_rotation * Math.PI / 180);
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
  
  float worldCoordDistance(WorldCoordinate a, WorldCoordinate b)
  {
    // put b in the same baseboard
    b.x = b.x + (b.baseboardX - a.baseboardX) * 720.0;
    b.y = b.y + (b.baseboardY - a.baseboardY) * 720.0;

    float dx = b.x - a.x;
    float dy = b.y - a.y;
    float dz = b.z - a.z;
    return Math.Sqrt(dx * dx + dy * dy + dz * dz);
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

      float velocity = traincar.GetVelocity();
      if (b_UseSmoothedPitchVelocity)
      {
        velocity = base.self.GetMyTrain().GetSmoothedVelocity();
        // velocity = m_lastVelocity[i] + (traincar.GetVelocity() - m_lastVelocity[i]) * 0.01;
      }

      // prevent a jolt when we start
      if (i >= m_lastVelocity.size() or wasStopped)
      m_lastVelocity[i] = velocity;

      
      // m_smoothedVelocity[i] = m_smoothedVelocity[i] + (velocity - m_smoothedVelocity[i]) * 0.01;

      // try to get a nicer derivative
      // float acceleration1 = (velocity - m_lastVelocity[i]) / timestep;
      // float acceleration2 = (m_lastVelocity[i] - m_lastVelocity2[i]) / timestep;
      float acceleration = (velocity - m_lastVelocity[i]) / timestep;
      
      float max_change = 5.0;
      if (acceleration > max_change)
        acceleration = max_change;
      if (acceleration < -max_change)
        acceleration = -max_change;
      
      // dim the pitch change based on our velocity
      // float velocity_dim = remap(0.0, 2.0, 3.0, 7.0, Math.Abs(traincar.GetVelocity()));
      float velocity_dim = smoothstep(Math.Fabs(velocity), 5, 1);
      // acceleration = acceleration * velocity_dim * velocity_dim;

      if (i >= m_smoothedAcceleration.size())
        m_smoothedAcceleration[i] = acceleration;
      m_smoothedAcceleration[i] = m_smoothedAcceleration[i] + (acceleration - m_smoothedAcceleration[i]) * 0.01;

      // float jerk = (acceleration - m_lastAcceleration[i]) / timestep;
      float jerk = m_smoothedAcceleration[i] * 0.05 * m_pitchIntensity * velocity_dim;
      if (b_UseConstantPitchVelocity)
      {
        if (velocity >= 0.0f)
          jerk = 1.0f * m_pitchIntensity * velocity_dim;
        else
          jerk = -1.0f * m_pitchIntensity * velocity_dim;
      }
      UpdateCGITraincar(traincar, i, velocity, jerk);

      m_lastVelocity[i] = velocity;
      // m_lastPosition[i] = pos;
      // m_lastAcceleration[i] = acceleration;
    }

    wasStopped = base.self.GetMyTrain().IsStopped();
  }

  void UpdateCGITraincar(Vehicle traincar, int seed, float velocity, float pitchFactor)
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
    // target.rx = target.rx + (acceleration * 4.0 * m_pitchIntensity * Math.PI / 180);
    // TrainzScript.Log("accel " + (string)acceleration);
    
    if (traincar != base.self)
      pitchFactor = pitchFactor * -1;

    traincar.SetMeshOrientation("default", target.rx, target.ry, target.rz);
    traincar.SetPitchBasedOnSpeed(pitchFactor);
  }
};