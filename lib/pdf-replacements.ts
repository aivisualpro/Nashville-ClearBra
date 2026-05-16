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

    // PPF
    ppfFilm: s("ppfFilm"),
    ppfLevel: s("ppfLevel"),
    ppfColor: s("ppfColor"),
    ppfPackages: ppfPackages.join(", "),
    ppfNotes: s("ppfNotes"),
    ppfPrice: ppf ? `$${ppf.toFixed(2)}` : "",

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
