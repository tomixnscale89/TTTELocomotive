include "gs.gs"


static class LightStyle
{
  // Straight outta Quake
  public define string Normal = "m";

  // 1 FLICKER (first variety)
	public define string Flicker = "mmnmmommommnonmmonqnmmo";

	// 2 SLOW STRONG PULSE
	public define string SlowPulse = "abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba";

	// 3 CANDLE (first variety)
	public define string Candle = "mmmmmaaaaammmmmaaaaaabcdefgabcdefg";

	// 4 FAST STROBE
	public define string FastStrobe = "mamamamamama";

	// 5 GENTLE PULSE 1
	public define string GentlePulse = "jklmnopqrstuvwxyzyxwvutsrqponmlkj";

	// 6 FLICKER (second variety)
	public define string Flicker2 = "nmonqnmomnmomomno";

	// 7 CANDLE (second variety)
	public define string Candle2 = "mmmaaaabcdefgmmmmaaaammmaamm";

	// 8 CANDLE (third variety)
	public define string Candle3 = "mmmaaammmaaammmabcdefaaaammmmabcdefmmmaaaa";

	// 9 SLOW STROBE (fourth variety)
	public define string SlowStrobe = "aaaaaaaazzzzzzzz";

	// 10 FLUORESCENT FLICKER
	public define string Fluorescent = "mmamammmmammamamaaamammma";

	// 11 SLOW PULSE NOT FADE TO BLACK
	public define string SlowPulseNoBlack = "abcdefghijklmnopqrrqponmlkjihgfedcba";

	// 12 UNDERWATER LIGHT MUTATION
	// this light only distorts the lightmap - no contribution
	// is made to the brightness of affected surfaces
	public define string Underwater = "mmnnmmnnnmmnn";

  // Time is the time in seconds.
  public float AnimateLight(float time, string style)
  {
    int i = (int)(time * 10) % style.size();

    int k = style[i] - "a"[0];
    // k = k * 22;

    return (float)k / 26.0;
  }

  public int Count()
  {
    return 13;
  }

  public string GetName(int style)
  {
    if (style == 0) return "Normal";
    if (style == 1) return "Flicker";
    if (style == 2) return "Slow Pulse";
    if (style == 3) return "Candle";
    if (style == 4) return "Fast Strobe";
    if (style == 5) return "Gentle Pulse";
    if (style == 6) return "Flicker (2)";
    if (style == 7) return "Candle (2)";
    if (style == 8) return "Candle (3)";
    if (style == 9) return "Slow Strobe";
    if (style == 10) return "Fluorescent Flicker";
    if (style == 11) return "Slow Pulse (No Black)";
    if (style == 12) return "Underwater";

    return "";
  }

  public string Get(int style)
  {
    if (style == 0) return Normal;
    if (style == 1) return Flicker;
    if (style == 2) return SlowPulse;
    if (style == 3) return Candle;
    if (style == 4) return FastStrobe;
    if (style == 5) return GentlePulse;
    if (style == 6) return Flicker2;
    if (style == 7) return Candle2;
    if (style == 8) return Candle3;
    if (style == 9) return SlowStrobe;
    if (style == 10) return Fluorescent;
    if (style == 11) return SlowPulseNoBlack;
    if (style == 12) return Underwater;

    return "";
  }
};