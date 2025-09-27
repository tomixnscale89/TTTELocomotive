
include "gs.gs"
include "soup.gs"
include "worldcoordinate.gs"
include "orientation.gs"
include "gstracksearch.gs"
//include "asset.gs"
//Helper utility library
class TTTEHelpers
{

  float ApproxAtan2(float y, float x);
  WorldCoordinate RotatePoint(WorldCoordinate point, float rotateangle);
  Orientation LookAt(WorldCoordinate A, WorldCoordinate B);
  Orientation DeltaRot(Orientation From, Orientation To);
  float rad_range(float in_x);
  float clamp(float x, float lower, float upper);

  int[] GetKuidData(KUID FoundKUID)
  {
    int[] ret;
    string kuidStr = FoundKUID.GetLogString();
    string[] tokens = Str.Tokens(kuidStr, "<:>");
    ret = new int[tokens.size() - 1]; //remove kuid/kuid2 token
    int i;
    for(i = 1; i < tokens.size(); i++)
      ret[i - 1] = Str.ToInt(tokens[i]);
    return ret;
  }

  // ============================================================================
  // Name: SetNamedFloatFromExisting()
  // Desc: Utility for copying soups.
  // ============================================================================
  void SetNamedFloatFromExisting(Soup in, Soup out, string tagName)
  {
    if(in.GetIndexForNamedTag(tagName) != -1) out.SetNamedTag(tagName, Str.UnpackFloat(in.GetNamedTag(tagName)));
  }

  // ============================================================================
  // Name: SoupHasTag()
  // Desc: Determine if a Soup contains a tag.
  // ============================================================================
  public bool SoupHasTag(Soup testSoup, string tagName)
  {
    if(testSoup.GetIndexForNamedTag(tagName) == -1)
      return false;
    
    //return false if it doesnt exist, otherwise return true
    return true;
  }

  bool FlagTest(int flags, int mask)
  {
    return flags == mask;
  }

  // ============================================================================
  // Name: GetNextVehicle(GSTrackSearch Search)
  // Desc:
  // ============================================================================

  Vehicle GetNextVehicle(GSTrackSearch Search)
  {
    Vehicle foundVehicle;
    while (Search.SearchNextObject())
    {
      foundVehicle = cast<Vehicle>Search.GetObject();
      if (foundVehicle != null)
        return foundVehicle;
    }
    return null;
  }

  // ============================================================================
  // Math Utility Functions
  // Desc: Trig functions and stuff.
  // ============================================================================

  public define float PI_2 = 3.14159265/2.0;

  float ApproxAtan(float z)
  {
      float n1 = 0.97239411;
      float n2 = -0.19194795;
      return (n1 + n2 * z * z) * z;
  }

  float ApproxAtan2(float y, float x)
  {
      if (x != 0.0)
      {
          if (Math.Fabs(x) > Math.Fabs(y))
          {
              float z = y / x;
              if (x > 0.0)
              {
                  // atan2(y,x) = atan(y/x) if x > 0
                  return ApproxAtan(z);
              }
              else if (y >= 0.0)
              {
                  // atan2(y,x) = atan(y/x) + PI if x < 0, y >= 0
                  return ApproxAtan(z) + Math.PI;
              }
              else
              {
                  // atan2(y,x) = atan(y/x) - PI if x < 0, y < 0
                  return ApproxAtan(z) - Math.PI;
              }
          }
          else // Use property atan(y/x) = PI/2 - atan(x/y) if |y/x| > 1.
          {
              float z = x / y;
              if (y > 0.0)
              {
                  // atan2(y,x) = PI/2 - atan(x/y) if |y/x| > 1, y > 0
                  return -ApproxAtan(z) + PI_2;
              }
              else
              {
                  // atan2(y,x) = -PI/2 - atan(x/y) if |y/x| > 1, y < 0
                  return -ApproxAtan(z) - PI_2;
              }
          }
      }
      else
      {
          if (y > 0.0) // x = 0, y > 0
          {
              return PI_2;
          }
          else if (y < 0.0) // x = 0, y < 0
          {
              return -PI_2;
          }
      }
      return 0.0; // x,y = 0. Could return NaN instead.
  }
  define int SINETIMEOUT = 512;

  float rad_range(float in_x)
  {
    float x = in_x;
    if(x and x != 0.0)
    {
      int Timeout = 0;
      if (x < -(float)Math.PI)
          while(Timeout < SINETIMEOUT and x < -(float)Math.PI)
          {
            x = x + (float)Math.PI * 2;
            Timeout++;
          }
      if (x > (float)Math.PI)
          while(Timeout < SINETIMEOUT and x > (float)Math.PI)
          {
            x = x - (float)Math.PI * 2;
            Timeout++;
          }
    }
    return x;
  }

  float fast_sin(float in_x)
  {
    float x = in_x;
    //always wrap input angle to -PI..PI
    if(x and x != 0.0)
    {
      int Timeout = 0;
      if (x < -(float)Math.PI)
          while(Timeout < SINETIMEOUT and x < -(float)Math.PI)
          {
            x = x + (float)Math.PI * 2;
            Timeout++;
          }
      if (x > (float)Math.PI)
          while(Timeout < SINETIMEOUT and x > (float)Math.PI)
          {
            x = x - (float)Math.PI * 2;
            Timeout++;
          }
    }

    if (x < 0)
    {
        float sin = (4 / (float)Math.PI) * x + (4 / (float)(Math.PI * Math.PI)) * x * x;

        if (sin < 0)
            return .225 * (sin * -sin - sin) + sin;

        return .225 * (sin * sin - sin) + sin;
    }
    else
    {
        float sin = (4 / (float)Math.PI) * x - (4 / (float)(Math.PI * Math.PI)) * x * x;

        if (sin < 0)
            return .225 * (sin * -sin - sin) + sin;

        return .225 * (sin * sin - sin) + sin;
    }
    return 0.0;
  }

  float fast_cos(float x)
  {
    return fast_sin((Math.PI / 2.0) - x);
  }

  WorldCoordinate RotatePoint(WorldCoordinate point, float rotateangle)
  {
    WorldCoordinate newpoint = new WorldCoordinate();
    float s = fast_sin(rotateangle);
    float c = fast_cos(rotateangle);
    newpoint.x = point.x * c - point.y * s;
    newpoint.y = point.x * s + point.y * c;
    newpoint.z = point.z;
    return newpoint;
  }

  Orientation LookAt(WorldCoordinate A, WorldCoordinate B)
  {
    float d_x = B.x - A.x;
    float d_y = B.y - A.y;
    float d_z = B.z - A.z;
    WorldCoordinate delta = new WorldCoordinate();
    delta.x = d_x;
    delta.y = d_y;
    delta.z = d_z;

    Orientation ang = new Orientation();
    float rot_z = ApproxAtan2(d_y, d_x);
    ang.rz = rot_z- Math.PI; // - Math.PI
    WorldCoordinate relative = RotatePoint(delta, -rot_z);
    ang.ry = ApproxAtan2(relative.z, relative.x);
    return ang;
  }

  Orientation DeltaRot(Orientation From, Orientation To)
  {
    Orientation ang = new Orientation();
    ang.rx = To.rx - From.rx;
    ang.ry = To.ry - From.ry;
    ang.rz = To.rz - From.rz;
    return ang;
  }

  float clamp(float x, float lower, float upper)
  {
    float ret = x;
    if(ret < lower)
      ret = lower;
    else if(ret > upper)
      ret = upper;
    return ret;
  }

  float Lerp(float from, float to, float t)
	{
		return (from + (to - from)*t);
	}
};