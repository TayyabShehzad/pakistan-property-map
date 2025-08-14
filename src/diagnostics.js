import { filterListings } from "./App.js";

const sampleListings = [
  { id: "1", city: "Karachi", status: "sale", size: 5,  price:  800000,  coords: [24.9, 67.1] },
  { id: "2", city: "Karachi", status: "buy",  size: 10, price: 1200000,  coords: [24.8, 67.2] },
  { id: "3", city: "Lahore",  status: "sale", size: 20, price: 3000000,  coords: [31.6, 74.3] },
  { id: "4", city: "Lahore",  status: "sale", size: 10, price:  600000,  coords: [31.5, 74.4] },
  { id: "5", city: "Islamabad", status: "buy", size: 20, price: 5000000, coords: [33.7, 73.0] },
];

function assertEqual(actual, expected, name) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "✅" : "❌"} ${name}`);
  if (!pass) {
    console.log("   expected:", expected);
    console.log("   actual  :", actual);
  }
}

export function runDiagnostics() {
  {
    const res = filterListings(sampleListings, { city: "Karachi", status: "all", size: [5, 20], price: [0, 1e9] });
    assertEqual(res.map(r => r.id), ["1", "2"], "filters by city (Karachi)");
  }
  {
    const res = filterListings(sampleListings, { city: "all", status: "sale", size: [5, 20], price: [0, 1e9] });
    assertEqual(res.map(r => r.id), ["1", "3", "4"], "filters by status (sale)");
  }
  {
    const res = filterListings(sampleListings, { city: "all", status: "all", size: [10, 20], price: [0, 1e9] });
    assertEqual(res.map(r => r.id), ["2", "3", "4", "5"], "filters by size [10,20] inclusive");
  }
  {
    const res = filterListings(sampleListings, { city: "all", status: "all", size: [5, 20], price: [800000, 1200000] });
    assertEqual(res.map(r => r.id), ["1", "2", "4"], "filters by price [800k,1.2M] inclusive");
  }
  {
    const res = filterListings(sampleListings, { city: "Lahore", status: "sale", size: [10, 10], price: [0, 1e9] });
    assertEqual(res.map(r => r.id), ["4"], "combined city+status+exact size");
  }
  {
    const res = filterListings(sampleListings, { city: "Islamabad", status: "sale", size: [5, 10], price: [0, 1000000] });
    assertEqual(res.map(r => r.id), [], "no results when criteria exclude all");
  }
  {
    const res = filterListings(sampleListings, { city: "all", status: "all", size: [5, 20], price: [5000000, 5000000] });
    assertEqual(res.map(r => r.id), ["5"], "price exact match boundary (inclusive)");
  }
}

if (typeof window === "undefined") {
  runDiagnostics();
}
