include "tttemenu.gs"
include "lightstyle.gs"

class LampMenu isclass CustomScriptMenu
{
  int easterCounter = 0;
  public bool b_AnimatedLight = false;

  public bool IsCore() { return true; }

  void UpdateLightColor()
  {
    base.popup.SetElementProperty("headlight-r", "value", (string)base.headlightR);
    base.popup.SetElementProperty("headlight-g", "value", (string)base.headlightG);
    base.popup.SetElementProperty("headlight-b", "value", (string)base.headlightB);
    base.popup.SetElementProperty("headlight-intensity", "value", (string)base.headlightScale);
  }

  public void PostRefresh()
  {
    UpdateLightColor();
  }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    output.Print("<h1><b>Lamps</h1>");
    output.Print("<br>");

    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");
    output.Print("<a href='live://easter_egg'>"); // Easter egg link
    output.Print("<table>");
      output.Print("<tr>");
        output.Print("<td></td>");
        output.Print("<td rowspan=2><img kuid='<kuid:414976:105416>' width=256 height=256></td>");
        //output.Print("<td rowspan=2><img kuid='<kuid:414976:105423>' width=48 height=48></td>");
      output.Print("</tr>");
      output.Print("<tr>");
        //overlay
        output.Print("<td colspan=2>");
          //output.Print("<img kuid='<kuid:414976:105423>' width=48 height=48>");

          //output.Print("<img kuid='<kuid:414976:105416>' width=256 height=256>");
          //upper row
          output.Print("<table>");
            output.Print("<tr height=10></tr>");
            output.Print("<tr height=48>");
              output.Print("<td width='98'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_tc'><img kuid='");
                if ((base.m_headCode & TTTEBase.HEADCODE_TC) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
            output.Print("</tr>");
          output.Print("</table>");
          output.Print("<br>");
          //bottom row
          output.Print("<table>");
            output.Print("<tr height=90></tr>"); //spacing
            output.Print("<tr height=48>");
              output.Print("<td width='32'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_br'><img kuid='");
                if ((base.m_headCode & TTTEBase.HEADCODE_BR) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
              output.Print("<td width='5'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_bc'><img kuid='");
                if ((base.m_headCode & TTTEBase.HEADCODE_BC) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
              output.Print("<td width='5'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_bl'><img kuid='");
                if ((base.m_headCode & TTTEBase.HEADCODE_BL) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
            output.Print("</tr>");
          output.Print("</table>");

        //end overlay
        output.Print("</td>");
      output.Print("</tr>");
    output.Print("</table>");
    output.Print("</a>"); // Easter egg link

    output.Print("<br>");
    output.Print(base.LabeledCheckbox("live://animate-light", b_AnimatedLight, "Animated Light"));
    if (b_AnimatedLight)
    {
      output.Print("<label>R</label>");
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=100% height=16 id='headlight-r' min=0.0 max=1.0 value=1.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print("<label>G</label>");
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=100% height=16 id='headlight-g' min=0.0 max=1.0 value=1.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print("<label>B</label>");
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=100% height=16 id='headlight-b' min=0.0 max=1.0 value=1.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print("<label>Intensity</label>");
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=100% height=16 id='headlight-intensity' min=0.0 max=4.0 value=1.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");

      // Light styles.
      output.Print("<table>");
      output.Print("<tr> <td width='300'></td> </tr>");
      int i;

      bool rowParity = false;
      for (i = 0; i < LightStyle.Count(); i++)
      {
        rowParity = !rowParity;
        if (rowParity)
          output.Print("<tr bgcolor=" + Colors.Primary + ">");
        else
          output.Print("<tr bgcolor=" + Colors.PrimaryDark + ">");

        output.Print("<td>");
        output.Print(base.LabeledRadio("live://set-lightstyle/" + (string)i, (base.lightStyle == i), LightStyle.GetName(i)));
        output.Print("</td>");

        output.Print("</tr>");
      }
      output.Print("</table>");
    }

    if(base.ExtraLampsContainer and base.ExtraLampsContainer.CountTags())
    {
      output.Print("<br>");
      output.Print("<h2>Custom Lamps:</h2>");
      output.Print("<br>");
      output.Print("<table>");
      output.Print("<tr> <td width='300'></td> </tr>");
      bool rowParity = false;
      int i;
      for(i = 0; i < base.ExtraLampsContainer.CountTags(); i++)
      {
        rowParity = !rowParity;
        string effectName = base.ExtraLampsContainer.GetIndexedTagName(i);
        string nameText = base.ExtraLampsContainer.GetNamedTag(effectName);
        if (rowParity)
          output.Print("<tr bgcolor=" + Colors.Primary + ">");
        else
          output.Print("<tr bgcolor=" + Colors.PrimaryDark + ">");

        output.Print("<td>");
        output.Print(base.LabeledCheckbox("live://extra-lamps/" + i, base.ExtraLampVisibility[i], nameText));
        output.Print("</td>");

        output.Print("</tr>");
      }
      output.Print("</table>");
    }

    output.Print("</body></html>");

    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:103609>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 29;
  }

  public void ProcessMessage(string cmd)
  {
    if(cmd == "live://lamp_tc")
    {
      if(base.GetHeadcodeSupported(TTTEBase.HEADCODE_TC))
      {
        base.m_headCode = base.m_headCode ^ TTTEBase.HEADCODE_TC;
        base.ConfigureHeadcodeLamps();
      }
    }
    else if(cmd == "live://lamp_bl")
    {
      if(base.GetHeadcodeSupported(TTTEBase.HEADCODE_BL))
      {
        base.m_headCode = base.m_headCode ^ TTTEBase.HEADCODE_BL;
        base.ConfigureHeadcodeLamps();
      }
    }
    else if(cmd == "live://lamp_bc")
    {
      if(base.GetHeadcodeSupported(TTTEBase.HEADCODE_BC))
      {
        base.m_headCode = base.m_headCode ^ TTTEBase.HEADCODE_BC;
        base.ConfigureHeadcodeLamps();
      }
    }
    else if(cmd == "live://lamp_br")
    {
      if(base.GetHeadcodeSupported(TTTEBase.HEADCODE_BR))
      {
        base.m_headCode = base.m_headCode ^ TTTEBase.HEADCODE_BR;
        base.ConfigureHeadcodeLamps();
      }
    }
    else if (cmd == "live://animate-light")
    {
      b_AnimatedLight = !b_AnimatedLight;
      if (!b_AnimatedLight)
      {
        base.lightStyle = -1;
      }
    }
    else if(cmd == "live://easter_egg")
    {
      easterCounter++;
      if (easterCounter >= 5)
      {
        easterCounter = 0;
        base.StartEasterEgg();
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://set-lightstyle/"))
    {
      string command = Str.Tokens(cmd, "live://set-lightstyle/")[0];
      if(command)
      {
        int style = Str.UnpackInt(command);
        base.SetLightStyle(style);
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://extra-lamps/"))
    {
      string command = Str.Tokens(cmd, "live://extra-lamps/")[0];
      if(command)
      {
         int TargetLamp = Str.UnpackInt(command);
         base.ToggleExtraLamp(TargetLamp);
      }
    }

    base.RefreshBrowser();
  }
};