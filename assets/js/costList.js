/* ================================================================
   STATIC RATE CARD
   ================================================================
   Powers the Itinerary & Cost Builder's "Internal Description"
   autocomplete (see index.html): when an agent types or selects a
   description that matches one of these entries exactly (case-
   insensitive), the row's Category and Net Cost fields are auto-
   filled from here.

   `category` values must match one of the Itinerary Builder's actual
   Category <select> options (Flight / Accommodation / Tours /
   Activities / Transfers / Meals / Other — see CATEGORIES_BY_TYPE in
   index.html; Flight is offered on FIT/Groups only, not Land Package)
   — not an arbitrary taxonomy.

   IMPORTANT: only the five entries below are confirmed real rates
   (provided directly, not invented). The client's full rate table has
   not been supplied yet — do not add further rows here without real
   data from Atlantis Holidays.
   ================================================================ */
const COST_LIST = [
    { description: 'Arrival transfer + Parking fee', category: 'Transfers', rate: 1000 },
    { description: 'Full day Bus DXB', category: 'Transfers', rate: 1155 },
    { description: 'Full day Bus AUH', category: 'Transfers', rate: 1350 },
    { description: 'Half day Bus DXB', category: 'Transfers', rate: 900 },
    { description: 'Departure transfer', category: 'Transfers', rate: 1200 },
];
