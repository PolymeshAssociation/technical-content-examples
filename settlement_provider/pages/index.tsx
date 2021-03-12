import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"

export default function Home() {

  return (
    <div className={styles.container}>
      <Head>
        <title>Index Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to NextDaq
        </h1>

        <h2>Where to?</h2>

        <a href="trader" className={styles.card}>
          View or add your orders on the trader's page
        </a>

        <a href="exchange" className={styles.card}>
          Match NextDaq orders on the algorithm page
        </a>

        <a href="custodian" className={styles.card}>
          Enter info for your matched trade on the custodian page
        </a>

      </main>

      <footer className={styles.footer}>
        <a
          href="http://polymath.network"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/polymath.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
