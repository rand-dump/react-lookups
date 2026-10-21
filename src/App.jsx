import React, { useMemo, useState } from "react";

const PINCODE_LENGTH = 6;

function App() {
  const [pincode, setPincode] = useState("");
  const [filter, setFilter] = useState("");
  const [postOffices, setPostOffices] = useState([]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredPostOffices = useMemo(() => {
    const searchTerm = filter.trim().toLowerCase();

    if (!searchTerm) return postOffices;

    return postOffices.filter(({ Name }) =>
      Name.toLowerCase().includes(searchTerm),
    );
  }, [filter, postOffices]);

  function handlePincodeChange(event) {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setPincode(digitsOnly.slice(0, PINCODE_LENGTH));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSearched(true);
    setFilter("");
    setError("");

    if (!/^\d{6}$/.test(pincode)) {
      setPostOffices([]);
      setLocation(null);
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    setIsLoading(true);
    setPostOffices([]);
    setLocation(null);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );

      if (!response.ok) {
        throw new Error("Unable to fetch postal data. Please try again.");
      }

      const result = await response.json();
      const postalData = result?.[0];

      if (
        !postalData ||
        postalData.Status !== "Success" ||
        !postalData.PostOffice?.length
      ) {
        throw new Error(
          postalData?.Message ||
            "Couldn’t find the postal data you’re looking for…",
        );
      }

      const firstPostOffice = postalData.PostOffice[0];
      setLocation({
        pincode: firstPostOffice.Pincode,
        district: firstPostOffice.District,
        state: firstPostOffice.State,
      });
      setPostOffices(postalData.PostOffice);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const showEmptyFilterMessage =
    hasSearched &&
    !isLoading &&
    !error &&
    postOffices.length > 0 &&
    filteredPostOffices.length === 0;

  return (
    <main className="page-shell">
      <section className="app-card">
        <header className="hero">
          <div className="brand-mark" aria-hidden="true">
            ⌖
          </div>
          <div>
            <p className="eyebrow">INDIA POST</p>
            <h1>Pincode Lookup</h1>
            <p className="subtitle">Find postal information across India.</p>
          </div>
        </header>

        <form className="lookup-form" onSubmit={handleSubmit}>
          <label htmlFor="pincode">Enter pincode</label>
          <div className="input-row">
            <input
              id="pincode"
              inputMode="numeric"
              maxLength={PINCODE_LENGTH}
              onChange={handlePincodeChange}
              placeholder="e.g. 110001"
              value={pincode}
            />
            <button disabled={isLoading} type="submit">
              {isLoading ? "Looking up…" : "Lookup"}
            </button>
          </div>
          <p className="helper-text">Enter a 6-digit Indian postal code</p>
        </form>

        {isLoading && (
          <div className="status-panel loading-panel" role="status">
            <span className="loader" aria-hidden="true" />
            <span>Fetching postal information…</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="status-panel error-panel" role="alert">
            <span className="status-icon" aria-hidden="true">
              !
            </span>
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && location && (
          <section className="results" aria-live="polite">
            <div className="location-summary">
              <div>
                <p className="section-label">POSTAL DETAILS</p>
                <h2>{location.district}</h2>
                <p className="location-meta">{location.state}</p>
              </div>
              <div className="pincode-badge">
                <span>Pincode</span>
                <strong>{location.pincode}</strong>
              </div>
            </div>

            <div className="filter-section">
              <label htmlFor="filter">Filter by post office</label>
              <div className="filter-input-wrap">
                <span aria-hidden="true">⌕</span>
                <input
                  id="filter"
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Search post office name"
                  type="search"
                  value={filter}
                />
              </div>
            </div>

            {showEmptyFilterMessage ? (
              <div className="empty-state">
                Couldn’t find the postal data you’re looking for…
              </div>
            ) : (
              <div className="office-list">
                {filteredPostOffices.map((office) => (
                  <article
                    className="office-card"
                    key={`${office.Name}-${office.Pincode}`}
                  >
                    <div className="office-detail">
                      <span>Name</span>
                      <strong>{office.Name}</strong>
                    </div>
                    <div className="office-detail">
                      <span>Branch Type</span>
                      <strong>{office.BranchType || "—"}</strong>
                    </div>
                    <div className="office-detail">
                      <span>Delivery Status</span>
                      <strong>{office.DeliveryStatus || "—"}</strong>
                    </div>
                    <div className="office-detail">
                      <span>District</span>
                      <strong>{office.District || "—"}</strong>
                    </div>
                    <div className="office-detail">
                      <span>Division</span>
                      <strong>{office.Division || "—"}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
      <p className="footer-note">Powered by the Indian Postal Pincode API</p>
    </main>
  );
}

export default App;
