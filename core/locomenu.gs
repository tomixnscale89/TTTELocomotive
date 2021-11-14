include "tttemenu.gs"


class LocoMenu isclass CustomScriptMenu
{
  bool b_WheelslipEnabled = false;
  bool b_ShakeEnabled = false;
  float b_ShakeIntensity = 0.02;
  float b_ShakePeriod = 0.04;
  float normal_maxtractiveeffort;
  float normal_traction;
  float normal_momentum;

  int ShakeTime = 0;
  float ShakeTargetX = 0;
  float ShakeTargetY = 0;
  float ShakeTargetZ = 0;
  float LastShakeTargetX = 0;
  float LastShakeTargetY = 0;
  float LastShakeTargetZ = 0;

  public bool IsCore() { return true; }
  
  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
  	output.Print("<table>");

    //output.Print("<tr><td>");
    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    //output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-wheelslip", b_WheelslipEnabled));
    output.Print(" " + base.strTable.GetString("wheelslip"));
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-shake", b_ShakeEnabled));
    output.Print(" " + base.strTable.GetString("shake"));
    if(b_ShakeEnabled)
    {
      output.Print("<br>");
      output.Print(base.strTable.GetString("shake_intensity"));
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='shakeintensity' min=0.0 max=0.2 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print(base.strTable.GetString("shake_period"));
      output.Print("<trainz-object style=edit-box link-on-focus-loss id=shakeperiod width=60 height=16></trainz-object>");
    }
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-couple", base.b_CoupleLockEnabled));
    output.Print(" " + base.strTable.GetString("couple_disable"));
    output.Print("</tr></td>");

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

  public void Open()
  {
    base.popup.SetElementProperty("shakeintensity", "value", (string)b_ShakeIntensity);
    base.popup.SetElementProperty("shakeperiod", "text", (string)b_ShakePeriod);
  }

  float Lerp(float from, float to, float t)
	{
		return (from + (to - from)*t);
	}

  public void Tick()
  {
    if(b_ShakeEnabled)
    {
      if(base.CurrentMenu == me)
      {
        b_ShakeIntensity = Str.UnpackFloat(base.popup.GetElementProperty("shakeintensity", "value"));
        b_ShakePeriod = Str.UnpackFloat(base.popup.GetElementProperty("shakeperiod", "text")); //seconds to tenths
      }

      //prevent divide by zero
      int localPeriod = (b_ShakePeriod * 100.0);
      if(localPeriod < 2) localPeriod = 2;

      float Along = (float)ShakeTime/(float)localPeriod;
      float InterpX = Lerp(LastShakeTargetX, ShakeTargetX, Along);
      float InterpY = Lerp(LastShakeTargetY, ShakeTargetY, Along);
      float InterpZ = Lerp(LastShakeTargetZ, ShakeTargetZ, Along);
      base.self.SetMeshOrientation("default", InterpX, InterpY, InterpZ);

      if(ShakeTime == localPeriod)
			{
				ShakeTime = 0;
				LastShakeTargetX = ShakeTargetX;
				LastShakeTargetY = ShakeTargetY;
				LastShakeTargetZ = ShakeTargetZ;
				ShakeTargetX = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
				ShakeTargetY = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
				ShakeTargetZ = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
			}

      ShakeTime++;
    }
    else if(base.CurrentMenu != me)
    {
      //stop ticking if we're running in the background and shake is disabled
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
    else if(cmd == "live://property/loco-couple")
    {
      base.b_CoupleLockEnabled = !base.b_CoupleLockEnabled;
    }

    base.RefreshBrowser();
  }
};