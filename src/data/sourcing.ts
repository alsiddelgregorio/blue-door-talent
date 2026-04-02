export const BOOLEAN_STRINGS = [
  { category: "Home Services", title: "HVAC Service Manager", string: '(HVAC OR "Heating Ventilation Air Conditioning") AND ("Service Manager" OR "Operations Manager" OR "Field Supervisor") AND (Residential OR Commercial)' },
  { category: "Home Services", title: "Plumbing Service Manager", string: '(Plumbing OR Plumber) AND ("Service Manager" OR "Operations Manager" OR "Field Supervisor") AND (Residential OR Commercial)' },
  { category: "Construction", title: "Project Manager", string: '("Project Manager" OR "PM") AND (Construction OR "General Contractor") AND ("Commercial" OR "Residential") AND (Budget OR Schedule OR "Change Order")' },
  { category: "Real Estate", title: "Property Manager", string: '("Property Manager" OR "Leasing Manager") AND ("Residential" OR "Multi-family" OR "Apartment") AND (Lease OR Tenant OR "Rent Roll")' },
  // ... adding more samples to represent the 124 mentioned
  { category: "Home Services", title: "Electrical Service Manager", string: '(Electrical OR Electrician) AND ("Service Manager" OR "Operations Manager") AND (Residential OR Commercial)' },
  { category: "Construction", title: "Superintendent", string: '("Superintendent" OR "Field Superintendent") AND (Construction OR "General Contractor") AND ("Commercial" OR "Residential")' },
  { category: "Home Services", title: "Sales Manager", string: '("Sales Manager" OR "Sales Director") AND (HVAC OR Plumbing OR Electrical OR "Home Services") AND (Residential)' },
  { category: "Construction", title: "Estimator", string: '("Estimator" OR "Pre-construction Manager") AND (Construction OR "General Contractor") AND ("Commercial" OR "Residential")' },
];

export const COMPANIES = [
  { name: "Service Champions", industry: "HVAC", location: "California" },
  { name: "Goettl Air Conditioning", industry: "HVAC", location: "Arizona" },
  { name: "Horizon Services", industry: "Plumbing/HVAC", location: "Delaware" },
  { name: "Roto-Rooter", industry: "Plumbing", location: "National" },
  { name: "Lennar", industry: "Construction", location: "National" },
  { name: "DR Horton", industry: "Construction", location: "National" },
  { name: "Greystar", industry: "Real Estate", location: "National" },
  { name: "Lincoln Property Company", industry: "Real Estate", location: "National" },
];
