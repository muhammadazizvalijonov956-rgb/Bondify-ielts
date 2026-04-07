import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Bondify",
  description:
    "Privacy Policy for Bondify IELTS and English practice platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-8 md:py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Effective date: March 28, 2026
          </p>
          <p className="mt-4 text-base leading-7 text-slate-700">
            Bondify respects your privacy. This Privacy Policy explains how we
            collect, use, store, and protect your information when you use our
            website, services, events, challenges, and learning tools.
          </p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold">1. Who we are</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Bondify is an online platform that provides English learning,
              IELTS-style practice, timed challenges, events, rankings, and
              related educational features through{" "}
              <a
                href="https://www.bondify.uz"
                className="font-medium text-blue-600 underline underline-offset-4"
              >
                bondify.uz
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              2. Information we collect
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              We may collect the following categories of information:
            </p>

            <div className="mt-4 space-y-4 text-slate-700">
              <div>
                <h3 className="text-lg font-semibold">A. Information you provide</h3>
                <ul className="mt-2 list-disc space-y-2 pl-6 leading-7">
                  <li>Name or username</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Profile photo or account details you choose to upload</li>
                  <li>Messages, support requests, or feedback you send us</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold">B. Learning and usage data</h3>
                <ul className="mt-2 list-disc space-y-2 pl-6 leading-7">
                  <li>Test answers and submitted responses</li>
                  <li>Scores, rankings, streaks, tokens, and event participation</li>
                  <li>Practice history and progress</li>
                  <li>Time spent on tasks and completion data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold">C. Technical data</h3>
                <ul className="mt-2 list-disc space-y-2 pl-6 leading-7">
                  <li>IP address</li>
                  <li>Browser type and device information</li>
                  <li>Operating system</li>
                  <li>Log data, crash data, and analytics information</li>
                  <li>Cookies or similar technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              3. How we use your information
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              We use your information to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-700">
              <li>Create and manage your account</li>
              <li>Provide practice tests, events, scores, and leaderboards</li>
              <li>Show your progress, achievements, and rankings</li>
              <li>Send verification emails, login codes, and account notices</li>
              <li>Improve our platform, challenges, and user experience</li>
              <li>Detect cheating, abuse, fraud, or security issues</li>
              <li>Respond to support requests and feedback</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Legal basis</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Depending on where you are located, we may process your
              information because it is necessary to provide our services, to
              meet legal obligations, for our legitimate interests in operating
              and improving Bondify, or based on your consent where required.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Cookies and analytics</h2>
            <p className="mt-3 leading-7 text-slate-700">
              We may use cookies and similar technologies to keep you signed in,
              remember preferences, measure performance, and understand how
              users interact with the platform. You can control cookies through
              your browser settings, but some parts of the service may not work
              properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Sharing of information</h2>
            <p className="mt-3 leading-7 text-slate-700">
              We do not sell your personal information. We may share information
              only in limited situations, such as:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-700">
              <li>
                With service providers that help us operate the platform, such
                as hosting, analytics, authentication, storage, or email
                delivery providers
              </li>
              <li>
                When required by law, regulation, legal process, or valid
                governmental request
              </li>
              <li>
                To protect the rights, safety, security, or property of Bondify,
                our users, or others
              </li>
              <li>
                As part of a merger, acquisition, restructuring, or sale of
                assets, if ever applicable
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Public information</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Certain information may be visible to other users if you use
              public features such as leaderboards, profiles, rankings,
              usernames, badges, or event participation. Please avoid choosing a
              username that reveals personal information you do not want to make
              public.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Data retention</h2>
            <p className="mt-3 leading-7 text-slate-700">
              We keep information only for as long as reasonably necessary to
              provide the service, maintain records, resolve disputes, enforce
              our agreements, improve the platform, and comply with legal
              obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Data security</h2>
            <p className="mt-3 leading-7 text-slate-700">
              We use reasonable administrative, technical, and organizational
              measures to protect information. However, no method of storage or
              transmission over the internet is completely secure, so we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Children’s privacy</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Bondify is not intended for use by children under the age required
              by applicable law without permission from a parent or guardian. If
              you believe a child has provided personal information improperly,
              please contact us so we can review and take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">11. Your rights</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Depending on your location, you may have rights to access, update,
              correct, delete, or restrict the use of your personal information,
              and to object to certain processing. To make a request, contact us
              using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              12. Third-party services and links
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Bondify may contain links to third-party websites or rely on
              third-party tools. We are not responsible for the privacy,
              security, or content practices of third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              13. Changes to this Privacy Policy
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              We may update this Privacy Policy from time to time. When we do,
              we will post the updated version on this page and change the
              effective date above. Continued use of Bondify after changes means
              you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">14. Contact us</h2>
            <p className="mt-3 leading-7 text-slate-700">
              If you have questions about this Privacy Policy or your personal
              information, contact us at:
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
              <p>
                <span className="font-semibold">Bondify</span>
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:support@bondify.uz"
                  className="text-blue-600 underline underline-offset-4"
                >
                  support@bondify.uz
                </a>
              </p>
              <p>
                Website:{" "}
                <a
                  href="https://www.bondify.uz"
                  className="text-blue-600 underline underline-offset-4"
                >
                  https://www.bondify.uz
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
