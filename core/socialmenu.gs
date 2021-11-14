include "tttemenu.gs"


class SocialMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }

  OnlineGroup GetSocialGroup()
  {
    TTTEOnline onlineLibrary = base.GetOnlineLibrary();
    return onlineLibrary.GetPersonalGroup();
  }

  string GetStatusString(int status)
  {
    switch(status)
    {
      case OnlineGroup.USER_STATUS_UNKNOWN:
        return "Unknown";
      case OnlineGroup.USER_STATUS_OFFLINE:
        return "Offline";
      case OnlineGroup.USER_STATUS_ONLINE:
        return "Online";
      case OnlineGroup.USER_STATUS_INSIDE:
        return "Active";
      case OnlineGroup.USER_STATUS_INVALID:
        return "Invalid";
      default:
        return "Error";
    }

    return "Error";
  }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("Invite your friends to control this locomotive!");
    output.Print("<br>");

    OnlineGroup socialGroup = GetSocialGroup();

    output.Print("<table width=300>");
    bool rowParity = false;

    int i;
    for(i = 0; i < socialGroup.CountUsers(); i++)
    {
      string user = socialGroup.GetIndexedUser(i);
      int status = socialGroup.GetUserStatus(i);

      rowParity = !rowParity;
      if (rowParity)
        output.Print("<tr bgcolor=#0E2A35 height=20>");
      else
        output.Print("<tr bgcolor=#05171E height=20>");

      output.Print("<td width=100>");
      output.Print(user);
      output.Print("</td>");

      output.Print("<td width=100>");
      if(status == OnlineGroup.USER_STATUS_INSIDE)
      {
        if(user == base.assignedFriend)
          output.Print("<a href='live://unassign_friend/" + (string)i + "'>Revoke Control</a>");
        else
          output.Print("<a href='live://assign_friend/" + (string)i + "'>Assign To Loco</a>");
      }
      output.Print("</td>");

      output.Print("<td width=50><a href='live://kick_friend/" + (string)i + "'>Kick</a></td>");
      
      output.Print("<td width=50>" + GetStatusString(status) + "</td>");

      output.Print("</tr>");
    }
    output.Print("</table>");

    output.Print("<br>");
    output.Print("iTrainz Username: ");
    output.Print("<trainz-object style=edit-box link-on-focus-loss id=social_user width=250 height=16></trainz-object>");
    output.Print("<br>");

    output.Print("<a href='live://invite_friend'>Invite</a>");
    output.Print("<br>");

    output.Print("</body></html>");
    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    return "<kuid:414976:102857>";
  }

  public void ProcessMessage(string cmd)
  {
    if(cmd == "live://invite_friend")
    {
      string inviteUser = base.popup.GetElementProperty("social_user", "text");
      TrainzScript.Log("sending invite to " + inviteUser);

      TTTEOnline onlineLibrary = base.GetOnlineLibrary();
      if(onlineLibrary and inviteUser != "")
        onlineLibrary.InviteToGroup(inviteUser);
      else
      {
        if(inviteUser == "")
            Interface.ShowMessageBox(base.self, "Invalid username specified.", true, "TTTEOnline", "invalidUser");
        else
            Interface.ShowMessageBox(base.self, "Unable to access online library.", true, "TTTEOnline", "invalidLibrary");
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://assign_friend/"))
    {
      string command = Str.Tokens(cmd, "live://assign_friend/")[0];
      if(command)
      {
        int idx = Str.ToInt(command);

        OnlineGroup socialGroup = GetSocialGroup();
        string user = socialGroup.GetIndexedUser(idx);
        
        base.assignedFriend = user;
        socialGroup.PostMessage(base.GetOnlineDesc());
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://kick_friend/"))
    {
      string command = Str.Tokens(cmd, "live://kick_friend/")[0];
      if(command)
      {
        int idx = Str.ToInt(command);

        OnlineGroup socialGroup = GetSocialGroup();
        string user = socialGroup.GetIndexedUser(idx);

        if(user != "")
          socialGroup.RemoveUser(user);
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://unassign_friend/"))
    {
      string command = Str.Tokens(cmd, "live://unassign_friend/")[0];
      if(command)
        base.assignedFriend = "";
    }

    base.RefreshBrowser();
  }
};