import styles from './pages.module.css';

export function PrivacyPage(): React.JSX.Element {
  return (
    <article className={styles.prose}>
      <h1>Privacy</h1>

      <h2>What is stored, and where</h2>
      <p>
        Your plans are saved in this browser&rsquo;s local storage on this device. There is no
        account, no sign-in and no copy on a server. Clearing your browser data removes them, and
        they do not follow you to another device.
      </p>

      <h2>What is sent, and when</h2>
      <p>
        Nothing is sent anywhere until you press a button that asks the assistant for something.
        There are three:
      </p>
      <ul>
        <li>
          <strong>Set it up for me</strong> sends the sentence you wrote about the event.
        </li>
        <li>
          <strong>Read it for me</strong> sends the one vendor message you pasted.
        </li>
        <li>
          <strong>Suggest ideas</strong> sends a short summary built from the model: the kind of
          event, the date and your largest cost lines. Not your names, not your notes.
        </li>
      </ul>

      <h2>Removed before sending</h2>
      <p>
        Email addresses, phone numbers, long digit sequences, UPI handles and links are stripped out
        in the browser, and stripped again on the server in case the first pass was bypassed.
      </p>

      <h2>The assistant</h2>
      <p>
        Requests go to this site&rsquo;s own server, which calls Google&rsquo;s Gemini API. The API
        key lives only on the server and never reaches your browser. Requests are not logged with
        their contents: server logs record that a request happened, not what was in it.
      </p>

      <h2>No tracking</h2>
      <p>
        There are no analytics, no advertising, no third-party scripts and no cookies. The page
        loads nothing from any other domain.
      </p>

      <p className={styles.disclaimer}>
        Treat anything you paste as something a third-party model will process. If a message
        contains something you would not want read by a service, remove it before pasting.
      </p>
    </article>
  );
}
