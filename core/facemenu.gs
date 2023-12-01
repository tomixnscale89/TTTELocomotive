include "tttemenu.gs"


class FaceMenu isclass CustomScriptMenu
{
  Soup m_faces;

  public bool IsCore() { return true; }
  
  void UpdateFaces()
  {
    m_faces = Constructors.NewSoup();
    int i;
    for(i = 0; i < base.FacesContainer.CountTags(); i++)
    {
      string tagName = base.FacesContainer.GetIndexedTagName(i);
      string faceName = base.FacesContainer.GetNamedTag(tagName);

      string[] tok = Str.Tokens(faceName, null);

      if (tok == null or tok.size() <= 1)
      {
        Soup data = m_faces.GetNamedSoupAdd(faceName);
        data.SetNamedTag("real-name", faceName);
        data.SetNamedTag("has-root", true);
        data.SetNamedTag("root-index", i);
      }
      else
      {
        string baseName = tok[0];
        string subName = faceName[baseName.size(),];
        Str.TrimLeft(subName, null);

        Soup data = m_faces.GetNamedSoupAdd(baseName);
        data.SetNamedTag("real-name", faceName);

        data.SetNamedTag("has-children", true);
        Soup children = data.GetNamedSoupAdd("children");
        

        Soup subdata = Constructors.NewSoup();
        subdata.SetNamedTag("label", subName);
        subdata.SetNamedTag("index", i);
        children.AddUniqueNamedSoup(subdata);
      }
    }
  }

  public string GetMenuHTML()
  {
    UpdateFaces();

    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");
    output.Print(base.strTable.GetString("faces_description"));
    output.Print("<br>");
    output.Print("<table>");
    output.Print("<tr> <td width='300'></td> </tr>");
    bool rowParity = false;
    int i, j;
    for(i = 0; i < m_faces.CountTags(); i++)
    {
      rowParity = !rowParity;

      
      Soup data = m_faces.GetNamedSoup(m_faces.GetIndexedTagName(i));
      string baseName = data.GetNamedTag("real-name");

      string rowcolor;

      if (rowParity)
        rowcolor = "#0E2A35";
      else
        rowcolor = "#05171E";
      
      output.Print("<tr bgcolor=" + rowcolor + ">");
      output.Print("<td>");

      bool hasRootLink = false;
      if (data.GetNamedTagAsBool("has-root"))
      {
        int rootIndex = data.GetNamedTagAsInt("root-index");
        if(i != base.faceSelection)
        {
          output.Print("<a href='live://face_set/" + rootIndex + "'>");
          hasRootLink = true;
        }
      }

      output.Print(baseName);

      if(hasRootLink)
        output.Print("</a>");

      output.Print("</td>");
      output.Print("</tr>");
      
      // Add a children row
      if (data.GetNamedTagAsBool("has-children"))
      {
        output.Print("<tr bgcolor=" + rowcolor + ">");
        output.Print("<td align=right>");
        
        // Embed a table so the entries are spaced apart.
        output.Print("<table>");
        output.Print("<tr>");
        Soup children = data.GetNamedSoup("children");
        for (j = 0; j < children.CountTags(); j++)
        {
          Soup childData = children.GetNamedSoup(children.GetIndexedTagName(j));
          string subName = childData.GetNamedTag("label");
          int subIndex = childData.GetNamedTagAsInt("index");

          output.Print("<td>");

          if(subIndex != base.faceSelection)
            output.Print("<a href='live://face_set/" + subIndex + "'>");
          
          output.Print(subName);

          if(subIndex != base.faceSelection)
            output.Print("</a>");
          
          output.Print("</td>");
        }
        output.Print("</tr>");
        output.Print("</table>");
        // Embedded table end.

        output.Print("</td>");
        output.Print("</tr>");
      }
    }

    Soup TTTESettings = base.GetTTTELocomotiveSettings();
    bool UseDLSContent = TTTESettings.GetNamedSoup("dls-content/").GetNamedTagAsBool("value", false) and !World.IsAssetRestrictionInEffect();
    //TrainzScript.Log("use DLS " + (string)UseDLSContent + " from soup " + TTTESettings.GetNamedSoup("dls-content/").AsString());

    if(UseDLSContent and base.InstalledDLSFaces)
    {
      for(i = 0; i < base.InstalledDLSFaces.size(); i++)
      {
        rowParity = !rowParity;
        Asset DLSFace = base.InstalledDLSFaces[i];
        StringTable FaceStrTable = DLSFace.GetStringTable();
        //Soup FaceExtensions = DLSFace.GetConfigSoup().GetNamedSoup("extensions");
        string faceName = FaceStrTable.GetString("displayname");
        if(!faceName or faceName == "")
          faceName = DLSFace.GetLocalisedName();

        if (rowParity)
          output.Print("<tr bgcolor=#0E2A35>"); // height='100'
        else
          output.Print("<tr bgcolor=#05171E>");

        output.Print("<td>");
        output.Print("<trainz-object width=20 height=20 style=preview asset='" + DLSFace.GetKUID().GetHTMLString() + "'></trainz-object>");

        if(i != base.DLSfaceSelection)
          output.Print("<a href='live://face_set_dls/" + i + "'>");
        output.Print(faceName);
        if(i != base.DLSfaceSelection)
          output.Print("</a>");


        output.Print("</td>");
        output.Print("</tr>");
      }
    }
    output.Print("</table>");

    if(UseDLSContent and base.DLSFaces and base.DLSFaces.size())
    {
      output.Print("<br>");
      output.Print("Download custom faces:");
      output.Print("<br>");
      rowParity = false;
      output.Print("<table>");
      for(i = 0; i < base.DLSFaces.size(); i++)
      {
        rowParity = !rowParity;
        Asset DLSFace = base.DLSFaces[i];
        string faceName = DLSFace.GetLocalisedName();

        if (rowParity)
          output.Print("<tr bgcolor=#0E2A35>"); // height='100'
        else
          output.Print("<tr bgcolor=#05171E>");

        output.Print("<td>");

        output.Print("<a href='live://dlc_download/" + i + "' tooltip='" + DLSFace.GetLocalisedDescription() + "'>");
        output.Print(faceName);
        output.Print("</a>");

        output.Print("</td>");

        //output.Print("<td>");
        //output.Print(DLSFace.GetLocalisedDescription());
        //output.Print("</td>");

        output.Print("<td align='right'>");
        output.Print("<trainz-object width=100 height=100 style=thumbnail-downloader asset='" + DLSFace.GetKUID().GetHTMLString() + "'></trainz-object>");
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
    return "<kuid:414976:105808>";
  }

  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://face_set/"))
    {
      string command = Str.Tokens(cmd, "live://face_set/")[0];
      if(command)
      {
        base.faceSelection = Str.UnpackInt(command);
        base.DLSfaceSelection = -1;
        base.ConfigureFaces();
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://face_set_dls/"))
    {
      string command = Str.Tokens(cmd, "live://face_set_dls/")[0];
      if(command)
      {
        base.faceSelection = -1;
        base.DLSfaceSelection = Str.UnpackInt(command);
        base.ConfigureFaces();
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://dlc_download/"))
    {
      string command = Str.Tokens(cmd, "live://dlc_download/")[0];
      if(command)
      {
        Asset DLSFace = base.DLSFaces[Str.UnpackInt(command)];
        TrainzScript.OpenURL("trainz://install/" + DLSFace.GetKUID().GetHTMLString());
        base.CurrentMenu = null;
      }
    }

    base.RefreshBrowser();
  }
};