export const metadata = {
  title: "Find your fit",
  alternates: { canonical: "/size-guide" },
};
export default function SizeGuide() {
  return (
    <main id="main" className="narrow-page">
      <p className="eyebrow">CHAPTER 01 / FIND YOUR FIT</p>
      <h1>
        A GOOD FIT.
        <br />A BETTER DAY.
      </h1>
      <p>
        Start with your usual EU shoe size. These are concept ranges; final
        measurements and fit guidance will be confirmed before launch.
      </p>
      <table className="size-table">
        <thead>
          <tr>
            <th>DEMO SIZE</th>
            <th>EU SHOE RANGE</th>
            <th>PROFILE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>36–40</td>
            <td>36–40</td>
            <td>Crew</td>
          </tr>
          <tr>
            <td>41–45</td>
            <td>41–45</td>
            <td>Crew</td>
          </tr>
        </tbody>
      </table>
      <p>
        Between sizes? Contact us before ordering once final products are
        available.
      </p>
    </main>
  );
}
