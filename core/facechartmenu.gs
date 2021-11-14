include "tttemenu.gs"

class FaceChartMenu isclass CustomScriptMenu
{
  Soup chartRows;

  // ============================================================================
  // Name: SoupHasTag()
  // Desc: Determine if a Soup contains a tag.
  // ============================================================================
  bool SoupHasTag(Soup testSoup, string tagName)
  {
    if(testSoup.GetIndexForNamedTag(tagName) == -1)
      return false;
    
    //return false if it doesnt exist, otherwise return true
    return true;
  }

  public bool IsCore() { return true; }
  
  define int face_width = 48;
  define int face_height = 48;
  define int face_margin = 2;

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    Soup headers = base.FaceChartContainer.GetNamedSoup("headers");

    output.Print("<table cellspacing=" + (string)face_margin + " bgcolor=#02172C>");

    int i;
    int j;
    output.Print("<tr height=" + (string)face_height + ">");
    //0, 0
    output.Print("<td></td>");
    for(i = 0; i < headers.CountTags(); i++)
    {
      string suffix = headers.GetIndexedTagName(i);
      string label = headers.GetNamedTag(suffix);
      output.Print("<td width=" + (string)face_width + "><b>" + label + "</b></td>");
    }
    output.Print("</tr>");

    for(i = 0; i < chartRows.CountTags(); i++)
    {
      output.Print("<tr height=" + (string)face_height + ">");
      string face_name = chartRows.GetIndexedTagName(i);
      Soup face_soup = chartRows.GetNamedSoup(face_name);

      string pretty_name = face_name;
      //Str.ToUpper(pretty_name[0]);

      //output.Print("<td><b>" + (string)(i + 1) + "</b></td>");
      output.Print("<td width='72'><b>" + pretty_name + "</b></td>");
      for(j = 0; j < headers.CountTags(); j++)
      {
        string suffix = headers.GetIndexedTagName(j);
        output.Print("<td bgcolor=#2C3D4D width=" + (string)face_width + ">");
        if(SoupHasTag(face_soup, suffix))
        {
          output.Print("<a href='live://face_set/" +  face_name + suffix + "'>");
          output.Print("<img src='facechart/" + face_name + suffix + ".png' width=" + (string)face_width + " height=" + (string)face_height + ">");
          output.Print("</a>");
        }
        output.Print("</td>");
      }
      output.Print("</tr>");
    }
    output.Print("</table>");

    output.Print("</body></html>");
    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    return "<kuid:414976:105808>";
  }

  void RegisterFace(string name, string suffix)
  {
    //get or create soup
    Soup faceSoup = chartRows.GetNamedSoupAdd(name);

    faceSoup.SetNamedTag(suffix, true);
  }

  public void Init()
  {
    chartRows = Constructors.NewSoup();

    Soup headers = base.FaceChartContainer.GetNamedSoup("headers");
    if(headers == null)
      return;

    int i;
    int j;
    for(i = 0; i < base.FacesContainer.CountTags(); i++)
    {
      string name = base.FacesContainer.GetIndexedTagName(i);
      string label = base.FacesContainer.GetNamedTag(name);

      for(j = 0; j < headers.CountTags(); j++)
      {
        string suffix = headers.GetIndexedTagName(j);
        //string label = headers.GetNamedTag(suffix);
        if(TrainUtil.HasSufix(name, suffix))
        {
          name = Str.Tokens(name, suffix)[0];
          RegisterFace(name, suffix);
          break;
        }
      }
    }
  }

  public int GetMenuWidth()
  {
    Soup headers = base.FaceChartContainer.GetNamedSoup("headers");
    if(headers == null)
      return TTTEBase.POPUP_WIDTH;
    
    return (face_width + face_margin) * (headers.CountTags() + 3) + face_margin;
  }

  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://face_set/"))
    {
      string command = cmd["live://face_set/".size(),];
      if(command)
      {
        int idx = base.FacesContainer.GetIndexForNamedTag(command);
        if(idx != -1)
        {
          base.faceSelection = idx;
          base.DLSfaceSelection = -1;
          base.ConfigureFaces();
        }
      }
    }

    base.RefreshBrowser();
  }
};