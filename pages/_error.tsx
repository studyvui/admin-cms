import type { NextPage } from "next";

export const runtime = "experimental-edge";

const ErrorPage: NextPage<{ statusCode?: number }> = ({ statusCode }) => {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>{statusCode ?? "Lỗi"}</h1>
      <p>Đã có lỗi xảy ra.</p>
    </div>
  );
};

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
