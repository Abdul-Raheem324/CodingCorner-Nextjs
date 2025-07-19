import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:wght@400;700&display=swap"
            rel="stylesheet"
          />
          
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          />

          <style>{`
            @font-face {
              font-family: 'Geist Sans';
              src: url('/fonts/GeistVF.woff') format('woff');
              font-weight: 100 900;
              font-style: normal;
            }
            @font-face {
              font-family: 'Geist Mono';
              src: url('/fonts/GeistMonoVF.woff') format('woff');
              font-weight: 100 900;
              font-style: normal;
            }
          `}</style>
        </Head>
        <body className="antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
