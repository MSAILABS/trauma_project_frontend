const FirstPage = () => {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: '100px auto 50px 50px',
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          letterSpacing: "1px",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        TRAUMA VISUALIZATION DEMO
      </h1>

      <video
        src={'graph_6_edited.mov'}
        style={{
          width: "80%",
          maxWidth: "70vw",
          borderRadius: "12px",
          border: "2px solid #ccc",
          objectFit: "cover",
          margin: "0px auto",
        }}
        controls
        loop
      />

      <a href="mailto:marvasti.marvsai@gmail.com">
        <button
          style={{
            padding: "12px 24px",
            fontSize: "1rem",
            cursor: "pointer",
            borderRadius: "8px",
            letterSpacing: "0.5px",
          }}
        >
          Contact Us For Demo
        </button>
      </a>

      <p>Email: marvasti.marvsai@gmail.com</p>
    </main>
  )
}

export default FirstPage
