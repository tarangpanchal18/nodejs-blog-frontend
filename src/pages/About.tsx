import { Header } from "@/components/Header";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <section className="rounded-xl border border-border bg-card p-8">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground">
            About Us
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Meowwdium is a writing platform where ideas, stories, and practical
            knowledge are shared in a clean reading experience.
          </p>
          <p className="mt-4 text-base leading-7 text-foreground/90">
            We built this space to make publishing simple for writers and
            discovery easy for readers. Whether you are here to write your first
            post or explore expert perspectives, this platform is designed to
            keep content front and center.
          </p>
        </section>
      </main>
    </div>
  );
}
