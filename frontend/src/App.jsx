import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

function App() {
  const [overview, setOverview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activePage, setActivePage] = useState("Overview");

  // Customer filters
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSegment, setCustomerSegment] = useState("All");
  const [customerSort, setCustomerSort] = useState("Monetary");

  // AI Analyst
  const [selectedSegmentName, setSelectedSegmentName] =
    useState("Champions");

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          overviewResponse,
          segmentsResponse,
          customersResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/overview`),
          fetch(`${API_URL}/api/segments`),
          fetch(`${API_URL}/api/customers`),
        ]);

        if (!overviewResponse.ok) {
          throw new Error("Failed to load overview");
        }

        if (!segmentsResponse.ok) {
          throw new Error("Failed to load segments");
        }

        if (!customersResponse.ok) {
          throw new Error("Failed to load customers");
        }

        const overviewData =
          await overviewResponse.json();

        const segmentsData =
          await segmentsResponse.json();

        const customersData =
          await customersResponse.json();

        setOverview(overviewData);
        setSegments(segmentsData);
        setCustomers(customersData);

        // Automatically select first segment
        if (segmentsData.length > 0) {
          setSelectedSegmentName(
            segmentsData[0].Segment
          );
        }

      } catch (error) {
        console.error(
          "Failed to fetch data:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // --------------------------------------------------
  // AI ANALYST
  // --------------------------------------------------

  async function askGemini() {
    if (!aiQuestion.trim()) {
      return;
    }

    const selectedSegment = segments.find(
      (segment) =>
        segment.Segment === selectedSegmentName
    );

    if (!selectedSegment) {
      setAiAnswer(
        "Please select a customer segment."
      );
      return;
    }

    setAiLoading(true);
    setAiAnswer("");

    try {
      const response = await fetch(
        `${API_URL}/api/ai/analyze`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            segment: selectedSegment.Segment,

            question: aiQuestion,

            customers: Number(
              selectedSegment.Customers
            ),

            avg_recency: Number(
              selectedSegment.Avg_Recency
            ),

            avg_frequency: Number(
              selectedSegment.Avg_Frequency
            ),

            avg_monetary: Number(
              selectedSegment.Avg_Monetary
            ),

            total_revenue: Number(
              selectedSegment.Total_Revenue
            ),

            revenue_share: Number(
              selectedSegment.Revenue_Share
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "AI request failed"
        );
      }

      setAiAnswer(
        data.answer ||
          data.response ||
          data.message ||
          "Gemini returned an empty response."
      );

    } catch (error) {
      console.error(
        "Gemini request failed:",
        error
      );

      setAiAnswer(
        "Unable to get an AI response right now. Please try again."
      );

    } finally {
      setAiLoading(false);
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Loading InsightAI...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN APP
  // --------------------------------------------------

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="w-64 bg-slate-950 text-white p-6">

        <div className="mb-10">

          <h1 className="text-xl font-bold">
            ✦ InsightAI
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Customer Intelligence
          </p>

        </div>

        <nav className="space-y-2">

          {[
            "Overview",
            "Segments",
            "Customers",
            "AI Analyst",
          ].map((page) => (

            <button
              key={page}
              onClick={() =>
                setActivePage(page)
              }
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activePage === page
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              {page}
            </button>

          ))}

        </nav>

      </aside>


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="flex-1 p-8">

        {/* ==================================================
            OVERVIEW
        ================================================== */}

        {activePage === "Overview" && (

          <OverviewPage
            overview={overview}
            segments={segments}
          />

        )}


        {/* ==================================================
            SEGMENTS
        ================================================== */}

        {activePage === "Segments" && (

          <SegmentsPage
            segments={segments}
          />

        )}


        {/* ==================================================
            CUSTOMERS
        ================================================== */}

        {activePage === "Customers" && (

          <CustomersPage
            customers={customers}
            search={customerSearch}
            setSearch={setCustomerSearch}
            segment={customerSegment}
            setSegment={setCustomerSegment}
            sort={customerSort}
            setSort={setCustomerSort}
          />

        )}


        {/* ==================================================
            AI ANALYST
        ================================================== */}

        {activePage === "AI Analyst" && (

          <AIAnalystPage
            segments={segments}
            selectedSegmentName={
              selectedSegmentName
            }
            setSelectedSegmentName={
              setSelectedSegmentName
            }
            aiQuestion={aiQuestion}
            setAiQuestion={setAiQuestion}
            aiAnswer={aiAnswer}
            aiLoading={aiLoading}
            askGemini={askGemini}
          />

        )}

      </main>

    </div>
  );
}


// ==================================================
// OVERVIEW PAGE
// ==================================================

function OverviewPage({
  overview,
  segments,
}) {

  return (
    <>

      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Customer Intelligence
        </h2>

        <p className="text-slate-500 mt-2">
          Understand your customers using RFM
          analysis and machine learning.
        </p>

      </div>


      {/* METRIC CARDS */}

      <div className="grid grid-cols-4 gap-5 mb-8">

        <MetricCard
          title="Customers"
          value={Number(
            overview.total_customers
          ).toLocaleString()}
          icon=""
        />

        <MetricCard
          title="Total Revenue"
          value={`£${Number(
            overview.total_revenue
          ).toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon=""
        />

        <MetricCard
          title="Champions"
          value={Number(
            overview.champions
          ).toLocaleString()}
          icon=""
        />

        <MetricCard
          title="Champion Revenue"
          value={`${Number(
            overview.champion_revenue_share
          ).toFixed(1)}%`}
          icon=""
        />

      </div>


      {/* CUSTOMER SEGMENTS */}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">

        <div className="mb-6">

          <h3 className="text-lg font-semibold">
            Customer Segments
          </h3>

          <p className="text-sm text-slate-500">
            RFM-based customer groups identified
            using K-Means clustering.
          </p>

        </div>


        <div className="grid grid-cols-2 gap-4">

          {segments.map((segment) => (

            <SegmentCard
              key={segment.Segment}
              segment={segment}
            />

          ))}

        </div>

      </div>

    </>
  );
}


// ==================================================
// SEGMENTS PAGE
// ==================================================

function SegmentsPage({
  segments,
}) {

  return (
    <>

      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Customer Segments
        </h2>

        <p className="text-slate-500 mt-2">
          Compare customer behavior and value
          across RFM segments.
        </p>

      </div>


      <div className="grid grid-cols-2 gap-5">

        {segments.map((segment) => (

          <div
            key={segment.Segment}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >

            {/* HEADER */}

            <div className="flex justify-between items-start">

              <div>

                <h3 className="text-xl font-semibold">
                  {segment.Segment}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {Number(
                    segment.Customers
                  ).toLocaleString()}{" "}
                  customers
                </p>

              </div>

              <span className="text-3xl">

                {segment.Segment ===
                  "Champions" && ""}

                {segment.Segment ===
                  "Regular Customers" && ""}

                {segment.Segment ===
                  "Recent Customers" && ""}

                {segment.Segment ===
                  "At Risk" && ""}

              </span>

            </div>


            {/* RFM STATS */}

            <div className="grid grid-cols-2 gap-5 mt-6">

              <Stat
                label="Average Recency"
                value={`${Number(
                  segment.Avg_Recency
                ).toFixed(1)} days`}
              />

              <Stat
                label="Average Frequency"
                value={Number(
                  segment.Avg_Frequency
                ).toFixed(1)}
              />

              <Stat
                label="Average Monetary"
                value={`£${Number(
                  segment.Avg_Monetary
                ).toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              />

              <Stat
                label="Revenue Share"
                value={`${Number(
                  segment.Revenue_Share
                ).toFixed(1)}%`}
              />

            </div>


            {/* TOTAL REVENUE */}

            <div className="mt-6 pt-5 border-t border-slate-100">

              <p className="text-sm text-slate-500">
                Total Revenue
              </p>

              <p className="text-2xl font-bold mt-1">
                £{Number(
                  segment.Total_Revenue
                ).toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

            </div>

          </div>

        ))}

      </div>

    </>
  );
}


// ==================================================
// CUSTOMERS PAGE
// ==================================================

function CustomersPage({
  customers,
  search,
  setSearch,
  segment,
  setSegment,
  sort,
  setSort,
}) {

  const filteredCustomers = customers
    .filter((customer) => {

      const matchesSearch =
        String(customer.CustomerID)
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesSegment =
        segment === "All" ||
        customer.Segment === segment;

      return (
        matchesSearch &&
        matchesSegment
      );

    })
    .sort((a, b) => {

      if (sort === "Recency") {
        return (
          Number(a.Recency) -
          Number(b.Recency)
        );
      }

      if (sort === "Frequency") {
        return (
          Number(b.Frequency) -
          Number(a.Frequency)
        );
      }

      return (
        Number(b.Monetary) -
        Number(a.Monetary)
      );

    });


  return (
    <>

      {/* HEADER */}

      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Customers
        </h2>

        <p className="text-slate-500 mt-2">
          Explore individual customer behavior
          using RFM metrics.
        </p>

      </div>


      {/* FILTERS */}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">

        <div className="grid grid-cols-3 gap-4">

          {/* SEARCH */}

          <input
            type="text"
            placeholder="Search Customer ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border border-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-slate-200"
          />


          {/* SEGMENT FILTER */}

          <select
            value={segment}
            onChange={(e) =>
              setSegment(e.target.value)
            }
            className="border border-slate-200 rounded-lg px-4 py-2 bg-white"
          >

            <option value="All">
              All Segments
            </option>

            <option value="Champions">
              Champions
            </option>

            <option value="Regular Customers">
              Regular Customers
            </option>

            <option value="Recent Customers">
              Recent Customers
            </option>

            <option value="At Risk">
              At Risk
            </option>

          </select>


          {/* SORT */}

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value)
            }
            className="border border-slate-200 rounded-lg px-4 py-2 bg-white"
          >

            <option value="Monetary">
              Highest Monetary
            </option>

            <option value="Frequency">
              Highest Frequency
            </option>

            <option value="Recency">
              Most Recent
            </option>

          </select>

        </div>

      </div>


      {/* RESULT COUNT */}

      <div className="mb-4">

        <p className="text-sm text-slate-500">
          Showing{" "}
          {filteredCustomers.length}{" "}
          customers
        </p>

      </div>


      {/* TABLE */}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              <th className="text-left px-6 py-4 text-sm font-semibold">
                Customer ID
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold">
                Segment
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold">
                Recency
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold">
                Frequency
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold">
                Monetary
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredCustomers.map(
              (customer) => (

                <tr
                  key={
                    customer.CustomerID
                  }
                  className="border-b border-slate-100 hover:bg-slate-50"
                >

                  <td className="px-6 py-4 font-medium">
                    {customer.CustomerID}
                  </td>


                  <td className="px-6 py-4">

                    <span className="px-3 py-1 rounded-full text-xs bg-slate-100">
                      {customer.Segment}
                    </span>

                  </td>


                  <td className="px-6 py-4">
                    {Number(
                      customer.Recency
                    ).toFixed(0)}{" "}
                    days
                  </td>


                  <td className="px-6 py-4">
                    {Number(
                      customer.Frequency
                    ).toFixed(0)}
                  </td>


                  <td className="px-6 py-4 font-medium">
                    £{Number(
                      customer.Monetary
                    ).toLocaleString(
                      "en-GB",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>


        {filteredCustomers.length === 0 && (

          <div className="p-10 text-center">

            <p className="text-slate-500">
              No customers found.
            </p>

          </div>

        )}

      </div>

    </>
  );
}


// ==================================================
// AI ANALYST PAGE
// ==================================================

function AIAnalystPage({
  segments,
  selectedSegmentName,
  setSelectedSegmentName,
  aiQuestion,
  setAiQuestion,
  aiAnswer,
  aiLoading,
  askGemini,
}) {

  const selectedSegment =
    segments.find(
      (segment) =>
        segment.Segment ===
        selectedSegmentName
    );


  return (
    <>

      {/* HEADER */}

      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          AI Analyst
        </h2>

        <p className="text-slate-500 mt-2">
          Ask questions about your customer segments.
        </p>

      </div>


      {/* SELECT SEGMENT */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

        <label className="block text-sm font-semibold mb-2">
          Select a customer segment
        </label>

        <select
          value={selectedSegmentName}
          onChange={(e) =>
            setSelectedSegmentName(
              e.target.value
            )
          }
          className="w-full border border-slate-200 rounded-lg px-4 py-3 bg-white"
        >

          {segments.map((segment) => (

            <option
              key={segment.Segment}
              value={segment.Segment}
            >
              {segment.Segment}
            </option>

          ))}

        </select>

      </div>


      {/* SELECTED SEGMENT */}

      {selectedSegment && (

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

          <h3 className="text-lg font-semibold mb-5">
            {selectedSegment.Segment}
          </h3>


          <div className="grid grid-cols-4 gap-5">

            <MetricCard
              title="Customers"
              value={Number(
                selectedSegment.Customers
              ).toLocaleString()}
              icon=""
            />

            <MetricCard
              title="Avg Recency"
              value={`${Number(
                selectedSegment.Avg_Recency
              ).toFixed(1)} days`}
              icon=""
            />

            <MetricCard
              title="Avg Frequency"
              value={Number(
                selectedSegment.Avg_Frequency
              ).toFixed(1)}
              icon=""
            />

            <MetricCard
              title="Avg Monetary"
              value={`£${Number(
                selectedSegment.Avg_Monetary
              ).toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              icon=""
            />

          </div>

        </div>

      )}


      {/* QUESTION */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">

        <label className="block text-sm font-semibold mb-2">
          What would you like to know?
        </label>

        <textarea
          value={aiQuestion}
          onChange={(e) =>
            setAiQuestion(e.target.value)
          }
          placeholder="e.g. Why are these customers valuable?"
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-slate-200"
        />


        <button
          onClick={askGemini}
          disabled={
            aiLoading ||
            !aiQuestion.trim()
          }
          className="mt-4 px-5 py-3 bg-slate-950 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >

          {aiLoading
            ? "Gemini is thinking..."
            : " Ask Gemini"}

        </button>

      </div>


      {/* AI ANSWER */}

      {aiAnswer && (

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">

          <h3 className="text-lg font-semibold mb-4">
            💡 AI Recommendation
          </h3>

          <div className="text-slate-700 leading-7 whitespace-pre-line">
            {aiAnswer}
          </div>

        </div>

      )}

    </>
  );
}


// ==================================================
// METRIC CARD
// ==================================================

function MetricCard({
  title,
  value,
  icon,
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="flex justify-between items-start">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="text-2xl font-bold mt-2">
            {value}
          </p>

        </div>


        <span className="text-2xl">
          {icon}
        </span>

      </div>

    </div>

  );
}


// ==================================================
// SEGMENT CARD
// ==================================================

function SegmentCard({
  segment,
}) {

  const segmentStyles = {

    Champions: {
      icon: "",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },

    "Regular Customers": {
      icon: "",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },

    "Recent Customers": {
      icon: "",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },

    "At Risk": {
      icon: "",
      bg: "bg-red-50",
      border: "border-red-200",
    },

  };


  const style =
    segmentStyles[
      segment.Segment
    ] || {
      icon: "👤",
      bg: "bg-slate-50",
      border: "border-slate-200",
    };


  return (

    <div
      className={`${style.bg} ${style.border} border rounded-xl p-5`}
    >

      {/* HEADER */}

      <div className="flex justify-between">

        <div>

          <span className="text-2xl">
            {style.icon}
          </span>

          <h4 className="font-semibold mt-3">
            {segment.Segment}
          </h4>

        </div>


        <div className="text-right">

          <p className="text-2xl font-bold">
            {Number(
              segment.Customers
            ).toLocaleString()}
          </p>

          <p className="text-xs text-slate-500">
            customers
          </p>

        </div>

      </div>


      {/* RFM VALUES */}

      <div className="grid grid-cols-3 gap-4 mt-6">

        <div>

          <p className="text-xs text-slate-500">
            Recency
          </p>

          <p className="font-semibold mt-1">
            {Number(
              segment.Avg_Recency
            ).toFixed(1)}d
          </p>

        </div>


        <div>

          <p className="text-xs text-slate-500">
            Frequency
          </p>

          <p className="font-semibold mt-1">
            {Number(
              segment.Avg_Frequency
            ).toFixed(1)}
          </p>

        </div>


        <div>

          <p className="text-xs text-slate-500">
            Monetary
          </p>

          <p className="font-semibold mt-1">
            £{Number(
              segment.Avg_Monetary
            ).toLocaleString(
              "en-GB",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </p>

        </div>

      </div>

    </div>

  );
}


// ==================================================
// STAT
// ==================================================

function Stat({
  label,
  value,
}) {

  return (

    <div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="font-semibold mt-1">
        {value}
      </p>

    </div>

  );

}


export default App;