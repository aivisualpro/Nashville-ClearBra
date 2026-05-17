/**
 * Shared utility: flatten intake/job data into a string→string map
 * for Google Docs template replacement.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JobData = Record<string, any>;

export function buildReplacements(data: JobData): Record<string, string> {
  const s = (key: string) => String(data[key] ?? "");

  // Compute tint totals
  const tintRows = (data.tintRows || []) as Array<{ series: string; shade: string; position: string; price: string }>;
  const tintTotal = tintRows.reduce((sum: number, r: { price: string }) => sum + (parseFloat(r.price) || 0), 0);

  // Compute grand total
  const ppf = parseFloat(s("ppfPrice")) || 0;
  const ceramic = parseFloat(s("ceramicTotal")) || 0;
  const wpf = parseFloat(s("wpfPrice")) || 0;
  const addons = parseFloat(s("addonsTotal")) || 0;
  const deposit = parseFloat(s("deposit")) || 0;
  const totalPrice = ppf + tintTotal + ceramic + wpf + addons - deposit;

  // Services list
  const services = (data.services || []) as string[];

  // Tint rows — flatten into numbered placeholders
  const tintReplacements: Record<string, string> = {};
  for (let i = 0; i < 8; i++) {
    const row = tintRows[i];
    const n = i + 1;
    tintReplacements[`tintRow${n}_series`] = row?.series || "";
    tintReplacements[`tintRow${n}_shade`] = row?.shade || "";
    tintReplacements[`tintRow${n}_position`] = row?.position || "";
    tintReplacements[`tintRow${n}_price`] = row?.price ? `$${parseFloat(row.price).toFixed(2)}` : "";
  }

  // PPF packages
  const ppfPackages = (data.ppfPackages || []) as string[];

  // Ceramic surfaces
  const ceramicSurfaces = (data.ceramicSurfaces || []) as string[];

  return {
    // Work Order Header
    ro: s("ro"),
    dropOffDate: s("dropOffDate"),
    completionDate: s("completionDate"),
    ig: s("ig"),
    tiktok: s("tiktok"),
    howHeard: s("howHeard"),
    xpelReferral: s("xpelReferral"),

    // Client
    clientName: s("clientName"),
    clientPhone: s("clientPhone"),
    clientEmail: s("clientEmail"),

    // Vehicle
    vYear: s("vYear"),
    vMake: s("vMake"),
    vModel: s("vModel"),
    vSubmodel: s("vSubmodel"),
    vTrim: s("vTrim"),
    vColor: s("vColor"),
    vPlate: s("vPlate"),
    vin: s("vin"),
    mileage: s("mileage"),

    // Staff
    intakeStaff: s("intakeStaff"),
    installer: s("installer"),
    ist: s("ist"),

    // Services
    services: services.join(", "),
    serviceCount: String(services.length),

    // Service checkboxes — include label text
    c_ppf: services.includes("ppf") ? "☑ Paint Protection Film (PPF)" : "☐ Paint Protection Film (PPF)",
    c_tnt: services.includes("tint") ? "☑ Window Tint" : "☐ Window Tint",
    c_wpf: services.includes("wpf") ? "☑ Windshield Protection Film (WPF)" : "☐ Windshield Protection Film (WPF)",
    c_cer: services.includes("ceramic") ? "☑ Ceramic Coating" : "☐ Ceramic Coating",
    c_add: services.includes("addons") ? "☑ Add-Ons" : "☐ Add-Ons",

    // PPF
    ppfFilm: s("ppfFilm"),
    ppfLevel: s("ppfLevel"),
    ppfColor: s("ppfColor"),
    ppfPackages: ppfPackages.join(", "),
    ppfNotes: s("ppfNotes"),
    ppfPrice: ppf ? `$${ppf.toFixed(2)}` : "",

    // PPF Film Type checkboxes
    c_up: s("ppfFilm") === "Ultimate Plus" ? "☑ Ultimate Plus" : "☐ Ultimate Plus",
    c_uf: s("ppfFilm") === "Ultimate Fusion" ? "☑ Ultimate Fusion" : "☐ Ultimate Fusion",
    c_st: s("ppfFilm") === "Stealth" ? "☑ Stealth" : "☐ Stealth",
    c_cp: s("ppfFilm") === "Color PPF" ? "☑ Color PPF" : "☐ Color PPF",

    // PPF Install Level
    c_std: (s("ppfLevel") === "STD" || !s("ppfLevel")) ? "☑ STD" : "☐ STD",
    c_ext: s("ppfLevel") === "EXT" ? "☑ EXT" : "☐ EXT",

    // PPF Package / Coverage checkboxes
    c_fc: ppfPackages.includes("Full Coverage") ? "☑ Full Coverage" : "☐ Full Coverage",
    c_ff: ppfPackages.includes("Full Front") ? "☑ Full Front" : "☐ Full Front",
    c_ffr: ppfPackages.includes("Full Front + Rockers") ? "☑ Full Front + Rockers" : "☐ Full Front + Rockers",
    c_tp: ppfPackages.includes("Track Pack") ? "☑ Track Pack" : "☐ Track Pack",
    c_pf: ppfPackages.includes("Partial Front") ? "☑ Partial Front" : "☐ Partial Front",
    c_wt: ppfPackages.includes("Wear and Tear") ? "☑ Wear and Tear" : "☐ Wear and Tear",
    c_hf: ppfPackages.includes("Hood Full") ? "☑ Hood Full" : "☐ Hood Full",
    c_hp: ppfPackages.includes("Hood Partial") ? "☑ Hood Partial" : "☐ Hood Partial",
    c_ad: ppfPackages.includes("All Doors") ? "☑ All Doors" : "☐ All Doors",
    c_sd: ppfPackages.includes("Single Door") ? "☑ Single Door" : "☐ Single Door",
    c_rk: ppfPackages.includes("Rockers") ? "☑ Rockers" : "☐ Rockers",
    c_dc: ppfPackages.includes("Door Cups / Edges") ? "☑ Door Cups / Edges" : "☐ Door Cups / Edges",
    c_hl: ppfPackages.includes("Headlights") ? "☑ Headlights" : "☐ Headlights",
    c_fl: ppfPackages.includes("Fog Lights") ? "☑ Fog Lights" : "☐ Fog Lights",
    c_tl: ppfPackages.includes("Taillights") ? "☑ Taillights" : "☐ Taillights",
    c_mc: ppfPackages.includes("Mirror Caps") ? "☑ Mirror Caps" : "☐ Mirror Caps",
    c_pl: ppfPackages.includes("A / B / C / D Pillars") ? "☑ A/B/C/D Pillars" : "☐ A/B/C/D Pillars",
    c_rf: ppfPackages.includes("Roof") ? "☑ Roof" : "☐ Roof",
    c_sp: ppfPackages.includes("Spoiler") ? "☑ Spoiler" : "☐ Spoiler",
    c_la: ppfPackages.includes("Luggage Area") ? "☑ Luggage Area" : "☐ Luggage Area",
    c_ic: ppfPackages.includes("Interior Console") ? "☑ Interior Console" : "☐ Interior Console",
    c_it: ppfPackages.includes("Interior Trim") ? "☑ Interior Trim" : "☐ Interior Trim",



    // Tint
    tintFilmSeries: s("tintFilmSeries"),
    tintTotal: tintTotal ? `$${tintTotal.toFixed(2)}` : "",
    ...tintReplacements,

    // Ceramic
    ceramicType: s("ceramicType"),
    ceramicSurfaces: ceramicSurfaces.join(", "),
    ceramicSurfacePrice: s("ceramicSurfacePrice"),
    ceramicTotal: ceramic ? `$${ceramic.toFixed(2)}` : "",

    // WPF
    wpfEnabled: s("wpfEnabled"),
    wpfPrice: wpf ? `$${wpf.toFixed(2)}` : "",

    // Add-ons
    screenType: s("screenType"),
    screenPrice: s("screenPrice"),
    lightFilm: s("lightFilm"),
    lightFront: s("lightFront"),
    lightRear: s("lightRear"),
    lightPrice: s("lightPrice"),
    emblemColor: s("emblemColor"),
    emblemFinish: s("emblemFinish"),
    removePanels: s("removePanels"),
    removePpf: s("removePpf"),
    removePrice: s("removePrice"),
    addonsTotal: addons ? `$${addons.toFixed(2)}` : "",

    // Job Instructions
    addRequests: s("addRequests"),

    // Pricing
    deposit: deposit ? `$${deposit.toFixed(2)}` : "",
    liabilityInitials: s("liabilityInitials"),
    refSource: s("refSource"),
    refDetails: s("refDetails"),
    refXpel: s("refXpel"),
    xpelReferred: s("xpelReferred"),

    // Damage
    damageNotes: s("damageNotes"),
    damageInitials: s("damageInitials"),
    bodyStyle: s("bodyStyle"),
    damageCount: String(((data.damagePins as unknown[] | undefined) || []).length),
    damageDiagramUrl: s("damageDiagramUrl"),
    damageDiagramGeneratedAt: s("damageDiagramGeneratedAt"),

    // Signature
    sigName: s("sigName"),
    sigDate: s("sigDate"),

    // Computed
    totalPrice: `$${totalPrice.toFixed(2)}`,
    submittedAt: new Date().toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
  };
}
