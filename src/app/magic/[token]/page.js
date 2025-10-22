import MagicClient from "./MagicClient";

export default async function MagicPage({ params }) {
  const { token } = await params;

  // Optional: fetch some initial data here if you want, or just pass token
  // e.g., const data = await fetchDataForToken(token);

  return <MagicClient token={token} />;
}
