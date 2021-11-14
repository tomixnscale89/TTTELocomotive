include "tttemenu.gs"


class LampMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }
  
  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");
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

    if(base.ExtraLampsContainer and base.ExtraLampsContainer.CountTags())
    {
      output.Print("<br>");
      output.Print("Custom Lamps:");
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
          output.Print("<tr bgcolor=#0E2A35>");
        else
          output.Print("<tr bgcolor=#05171E>");

        output.Print("<td>");
        output.Print(HTMLWindow.CheckBox("live://extra-lamps/" + i, base.ExtraLampVisibility[i]));
        output.Print(" " + nameText);
        output.Print("</tr></td>");
      }
      output.Print("</table>");
    }

    output.Print("</body></html>");

    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    return "<kuid:414976:103609>";
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