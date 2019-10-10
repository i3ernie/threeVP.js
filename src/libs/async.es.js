
import series from "../vendor/async-es/series.js";
import waterfall from "../vendor/async-es/waterfall.js";

let async = {series:series, waterfall:waterfall};

export {series, waterfall}
export default async;