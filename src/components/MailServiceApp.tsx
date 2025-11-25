import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Member } from '../data/mailMembers';
import { members as memberData } from '../data/mailMembers';
import { marked } from 'marked';

type SendState = 'idle' | 'sending' | 'success' | 'error';

type SendStatus = {
  state: SendState;
  message?: string;
};

type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // base64
};

const defaultUser = {
  name: 'Max Beispiel',
  email: 'max.beispiel@repair-leonberg.de',
  role: ''
};

const defaultBody = `{{Anrede}},

kurzes Update aus dem Repair Café:

wir treffen uns am Samstag um 10:00 Uhr. Wer Zeit hat, bitte kurz antworten oder im Kalender eintragen. Danke!

{{Gruss}}
{{Signatur}}`;

const chipColors = [
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-emerald-50 text-emerald-800 border-emerald-200',
  'bg-sky-50 text-sky-800 border-sky-200',
  'bg-indigo-50 text-indigo-800 border-indigo-200',
  'bg-pink-50 text-pink-800 border-pink-200',
  'bg-rose-50 text-rose-800 border-rose-200'
];

const STORAGE_KEY = 'mailservice_members_v1';

const MailServiceApp = () => {
  const [members, setMembers] = useState<Member[]>(memberData);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState(defaultUser);
  const senderOptions = useMemo(
    () =>
      members
        .filter((m) => m.email)
        .map((m) => ({
          label: `${m.firstName} ${m.lastName}`,
          value: m.id,
          email: m.email!
        })),
    [members]
  );
  const [senderChoice, setSenderChoice] = useState<string>(() => senderOptions[0]?.value ?? 'custom');
  const [customEmail, setCustomEmail] = useState(senderOptions[0]?.email ?? '');
  const [subject, setSubject] = useState('Neuigkeiten aus dem Repair Café Leonberg');
  const [editorHtml, setEditorHtml] = useState<string>(() => marked.parse(defaultBody));
  const [status, setStatus] = useState<SendStatus>({ state: 'idle' });
  const [newMember, setNewMember] = useState<Partial<Member>>({
    firstName: '',
    lastName: '',
    email: '',
    tags: [],
    greeting: '',
    closing: '',
    isMember: true
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditorEmpty = (html: string) =>
    html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0;

  // Load persisted members (adds/removes) from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setMembers(parsed);
      }
    } catch (error) {
      console.warn('Konnte Mitgliederliste nicht aus localStorage laden', error);
    }
  }, []);

  // Persist members after changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    } catch (error) {
      console.warn('Konnte Mitgliederliste nicht speichern', error);
    }
  }, [members]);

  useEffect(() => {
    const html = marked.parse(defaultBody);
    setEditorHtml(html);
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  }, []);

  useEffect(() => {
    if (senderChoice !== 'custom') {
      const m = members.find((mem) => mem.id === senderChoice);
      if (m) {
        setUser((prev) => ({
          ...prev,
          name: `${m.firstName} ${m.lastName}`,
          email: m.email || ''
        }));
        setCustomEmail('');
      }
    }
  }, [senderChoice, members]);

  const execFormat = (command: string, value?: string) => {
    if (typeof document === 'undefined') return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
    }
  };

  const tags = useMemo(() => {
    const list = members.flatMap((m) =>
      (m.tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'de'));
  }, [members]);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members
      .filter((member) => {
        const matchesSearch =
          term.length === 0 ||
          `${member.firstName} ${member.lastName}`.toLowerCase().includes(term) ||
          (member.email ?? '').toLowerCase().includes(term) ||
          member.tags.some((tag) => tag.toLowerCase().includes(term));

        const matchesTags =
          selectedTags.size === 0 || member.tags.some((tag) => selectedTags.has(tag));

        return matchesSearch && matchesTags;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'de'));
  }, [search, selectedTags, members]);

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.has(m.id)),
    [selectedIds, members]
  );

  const previewMember =
    selectedMembers.find((m) => Boolean(m.email)) ||
    filteredMembers.find((m) => Boolean(m.email)) ||
    members.find((m) => Boolean(m.email));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectFiltered = () => {
    const withEmails = filteredMembers.filter((m) => m.email);
    setSelectedIds(new Set(withEmails.map((m) => m.id)));
  };

  const selectAllMembers = () => {
    const withEmails = members.filter((m) => m.email);
    setSelectedIds(new Set(withEmails.map((m) => m.id)));
  };

  const chipColorFor = (tag: string) => {
    const index =
      tag.length === 0
        ? 0
        : tag
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) % chipColors.length;
    return chipColors[index];
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (!base64) return;
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${file.name}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            content: base64
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const buildSignature = () => {
    const role = user.role?.trim();
    const nameLine = `${user.name}${role ? ' – ' + role : ''}`;
    return {
      text: `${nameLine}\nRepair Café Leonberg`,
      html: `${nameLine}<br />Repair Café Leonberg`
    };
  };

  const applyPlaceholders = (html: string, member: Member) => {
    const greeting = member.greeting || `Hallo ${member.firstName}`;
    const closing = member.closing || 'Viele Grüße';
    const signature = buildSignature();
    return html
      .replace(/{{Anrede}}/g, greeting)
      .replace(/{{Gruss}}/g, closing)
      .replace(/{{Signatur}}/g, `<br />${signature.html}`);
  };

  const htmlToText = (html: string) => {
    const withBreaks = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '');
    if (typeof document === 'undefined') {
      return withBreaks.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = withBreaks;
    return tmp.textContent || tmp.innerText || '';
  };

  const personalizeMessage = (member: Member) => {
    const withPlaceholders = applyPlaceholders(editorHtml, member);
    const textVersion = htmlToText(withPlaceholders);
    return { text: textVersion, html: withPlaceholders };
  };

  const statusTone: Record<SendState, string> = {
    idle: 'text-slate-500',
    sending: 'text-amber-600',
    success: 'text-emerald-700',
    error: 'text-rose-600'
  };

  const exportMembers = async () => {
    try {
      const { utils, writeFileXLSX } = await import('xlsx');
      const rows = filteredMembers.map((m) => ({
        Vorname: m.firstName,
        Nachname: m.lastName,
        'E-Mail': m.email ?? '',
        Tags: m.tags.join(', '),
        Anrede: m.greeting,
        Grußformel: m.closing
      }));
      const ws = utils.json_to_sheet(rows);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Mitglieder');
      writeFileXLSX(wb, 'mitglieder.xlsx');
    } catch (error) {
      console.error('Export fehlgeschlagen', error);
      setStatus({
        state: 'error',
        message: 'Export nicht möglich. Bitte Browser prüfen.'
      });
    }
  };

  const handleAddMember = () => {
    if (!newMember.firstName || !newMember.lastName) return;
    const id = `${(newMember.firstName || '').toLowerCase().replace(/\s+/g, '-')}-${(newMember.lastName || '')
      .toLowerCase()
      .replace(/\s+/g, '-')}-${Date.now()}`;
    const memberToAdd: Member = {
      id,
      firstName: newMember.firstName.trim(),
      lastName: newMember.lastName.trim(),
      email: newMember.email?.trim() || undefined,
      isMember: true,
      tags: (newMember.tags || []).filter(Boolean),
      greeting: newMember.greeting || `Hallo ${newMember.firstName}`,
      closing: newMember.closing || 'Viele Grüße',
      personalNote: ''
    };
    setMembers((prev) => [...prev, memberToAdd]);
    setNewMember({
      firstName: '',
      lastName: '',
      email: '',
      tags: [],
      greeting: '',
      closing: '',
      isMember: true
    });
    setShowAddForm(false);
  };

  const handleSend = async () => {
    const senderEmail = senderChoice === 'custom' ? customEmail.trim() : members.find((m) => m.id === senderChoice)?.email;

    if (!senderEmail) {
      setStatus({
        state: 'error',
        message: 'Bitte eine Absender-Adresse auswählen oder eingeben.'
      });
      return;
    }

    const recipients = selectedMembers.filter((m) => m.email);
    if (recipients.length === 0) {
      setStatus({
        state: 'error',
        message: 'Keine gültigen Empfänger ausgewählt.'
      });
      return;
    }

    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      setStatus({
        state: 'error',
        message: 'Bitte einen Betreff vergeben.'
      });
      return;
    }

    if (isEditorEmpty(editorHtml)) {
      setStatus({
        state: 'error',
        message: 'Bitte einen Nachrichtentext eingeben.'
      });
      return;
    }

    setStatus({ state: 'sending', message: 'Sende E-Mails…' });

    try {
      const payload = {
        fromName: user.name,
        fromEmail: senderEmail,
        replyTo: senderEmail,
        subject: trimmedSubject,
        recipients: recipients.map((member) => ({
          id: member.id,
          email: member.email!,
          name: `${member.firstName} ${member.lastName}`,
          messageText: personalizeMessage(member).text,
          messageHtml: personalizeMessage(member).html
        })),
        attachments: attachments.map((a) => ({
          filename: a.name,
          content: a.content,
          contentType: a.type
        }))
      };

      const res = await fetch('/members/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'SMTP-Versand fehlgeschlagen');
      }

      const data = await res.json();
      setStatus({
        state: 'success',
        message: data.message || `Versandt an ${recipients.length} Empfänger.`
      });
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Versand fehlgeschlagen.'
      });
    }
  };

  const senderEmail = senderChoice === 'custom' ? customEmail.trim() : members.find((m) => m.id === senderChoice)?.email;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Absender</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Wer verschickt die Mail?</h2>
            <p className="text-sm text-slate-600">
              Wähle dich aus der Liste oder gib eine eigene Adresse ein. Antworten landen bei dir.
            </p>
          </div>
          <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
            Reply-To: {senderEmail || '—'}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Mitglied wählen</span>
            <select
              value={senderChoice}
              onChange={(e) => {
                const next = e.target.value;
                setSenderChoice(next);
                if (next !== 'custom') {
                  const m = members.find((mem) => mem.id === next);
                  if (m) {
                    setUser((prev) => ({
                      ...prev,
                      name: `${m.firstName} ${m.lastName}`,
                      email: m.email || '',
                      role: prev.role
                    }));
                  }
                }
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              {senderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.email})
                </option>
              ))}
              <option value="custom">Eigene Adresse eingeben…</option>
            </select>
          </label>

          {senderChoice === 'custom' && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Eigene E-Mail</span>
              <input
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="du@beispiel.de"
              />
            </label>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Absender bleibt info@repair-leonberg.de, Antworten gehen an <span className="font-semibold">{senderEmail || 'deine Adresse'}</span>.
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Empfänger</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Adress-Selektion & Mitglieder</h2>
            <p className="text-sm text-slate-600">Suche, filtere nach Tags und wähle die passenden Personen.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <button
              onClick={selectFiltered}
              className="rounded-full bg-slate-100 px-3 py-1 transition hover:bg-slate-200"
            >
              Sichtbare auswählen
            </button>
            <button
              onClick={selectAllMembers}
              className="rounded-full bg-slate-100 px-3 py-1 transition hover:bg-slate-200"
            >
              Alle mit Mailadresse
            </button>
            <button
              onClick={() => setSelectedIds(new Set(members.map((m) => m.id)))}
              className="rounded-full bg-slate-100 px-3 py-1 transition hover:bg-slate-200"
            >
              Alle (inkl. ohne Mail)
            </button>
            <button
              onClick={clearSelection}
              className="rounded-full bg-slate-100 px-3 py-1 transition hover:bg-slate-200"
            >
              Auswahl leeren
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Name, Mail oder Tag…"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-10 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <span className="pointer-events-none absolute left-3 top-3 text-slate-400">⌕</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-600 sm:items-center sm:justify-end">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Sichtbar: {filteredMembers.length}/{members.length}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              Auswahl: {selectedMembers.length}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = selectedTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                  selected ? 'ring-2 ring-brand-200 ring-offset-2 ring-offset-white' : ''
                } ${chipColorFor(tag)}`}
              >
                <span>{tag}</span>
                <span className="text-xs text-slate-500">
                  {members.filter((m) => m.tags.includes(tag) && m.email).length}
                </span>
              </button>
            );
          })}
          {tags.length === 0 && <span className="text-sm text-slate-500">Keine Tags gepflegt.</span>}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-800">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Auswahl</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Mail</th>
                  <th className="px-3 py-2 text-left">Tags</th>
                  <th className="px-3 py-2 text-left">Anrede / Gruß</th>
                  <th className="px-3 py-2 text-left">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const selected = selectedIds.has(member.id);
                  const disabled = !member.email;
                  return (
                    <tr
                      key={member.id}
                      onClick={() => {
                        if (disabled) return;
                        toggleMember(member.id);
                      }}
                      className={`border-t border-slate-200 ${disabled ? 'opacity-60' : 'cursor-pointer hover:bg-slate-50'}`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={disabled}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleMember(member.id)}
                          className="h-4 w-4 accent-brand-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">
                          {member.firstName} {member.lastName}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {member.email || 'Keine E-Mail'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {member.tags.length === 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                              —
                            </span>
                          )}
                          {member.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-2 py-1 text-xs ${chipColorFor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                            {member.greeting}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                            {member.closing}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const confirmed = window.confirm(
                                `Soll ${member.firstName} ${member.lastName} wirklich entfernt werden?`
                              );
                              if (!confirmed) return;
                              setMembers((prev) => prev.filter((m) => m.id !== member.id));
                              if (senderChoice === member.id) {
                                setSenderChoice('custom');
                              }
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                              next.delete(member.id);
                              return next;
                            });
                          }}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                        >
                          Entfernen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {showAddForm ? 'Eingabe schließen' : 'Person hinzufügen'}
            </button>
            <button
              onClick={exportMembers}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-200"
            >
              Export XLSX
            </button>
          </div>

          {showAddForm && (
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Vorname</span>
                  <input
                    value={newMember.firstName || ''}
                    onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Vorname"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Nachname</span>
                  <input
                    value={newMember.lastName || ''}
                    onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Nachname"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">E-Mail</span>
                  <input
                    value={newMember.email || ''}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="mail@beispiel.de"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Tags (comma-getrennt)</span>
                  <input
                    value={(newMember.tags || []).join(', ')}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Elektro, Fahrrad, ..."
                  />
                </label>
              </div>
              <div>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Anrede</span>
                  <input
                    value={newMember.greeting || ''}
                    onChange={(e) => setNewMember({ ...newMember, greeting: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Lieber Max"
                  />
                </label>
              </div>
              <div>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Grußformel</span>
                  <input
                    value={newMember.closing || ''}
                    onChange={(e) => setNewMember({ ...newMember, closing: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Viele Grüße"
                  />
                </label>
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleAddMember}
                  className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  Person speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Editor</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Nachricht erstellen</h2>
            </div>
            <span className="text-xs text-slate-500">
              Platzhalter: {'{{Anrede}}, {{Gruss}}, {{Signatur}}'}
            </span>
          </div>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Betreff</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="Betreff eingeben"
              />
            </label>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                <button
                  onClick={() => execFormat('bold')}
                  className="rounded-lg bg-slate-100 px-2 py-1 font-semibold transition hover:bg-slate-200"
                >
                  B
                </button>
                <button
                  onClick={() => execFormat('italic')}
                  className="rounded-lg bg-slate-100 px-2 py-1 italic transition hover:bg-slate-200"
                >
                  I
                </button>
                <button
                  onClick={() => execFormat('underline')}
                  className="rounded-lg bg-slate-100 px-2 py-1 underline transition hover:bg-slate-200"
                >
                  U
                </button>
                <button
                  onClick={() => execFormat('insertUnorderedList')}
                  className="rounded-lg bg-slate-100 px-2 py-1 transition hover:bg-slate-200"
                >
                  • Liste
                </button>
                <button
                  onClick={() => execFormat('insertOrderedList')}
                  className="rounded-lg bg-slate-100 px-2 py-1 transition hover:bg-slate-200"
                >
                  1. Liste
                </button>
                <button
                  onClick={() => {
                    const url = prompt('Link-URL eingeben:');
                    if (url) execFormat('createLink', url);
                  }}
                  className="rounded-lg bg-slate-100 px-2 py-1 transition hover:bg-slate-200"
                >
                  Link
                </button>
                <button
                  onClick={() => execFormat('insertText', '{{Anrede}}')}
                  className="rounded-lg bg-slate-100 px-2 py-1 transition hover:bg-slate-200"
                >
                  {'{{Anrede}}'}
                </button>
                <button
                  onClick={() => execFormat('insertText', '{{Gruss}}')}
                  className="rounded-lg bg-slate-100 px-2 py-1 transition hover:bg-slate-200"
                >
                  {'{{Gruss}}'}
                </button>
                <button
                  onClick={() => execFormat('insertText', '{{Signatur}}')}
                  className="rounded-lg bg-slate-100 px-2 py-1 transition hover:bg-slate-200"
                >
                  {'{{Signatur}}'}
                </button>
              </div>
              <div className="relative mt-2">
                {isEditorEmpty(editorHtml) && (
                  <div className="pointer-events-none absolute inset-3 text-sm text-slate-400">
                    Schreibe deine Nachricht … Platzhalter wie {'{{Anrede}}'}, {'{{Gruss}}'}, {'{{Signatur}}'}
                  </div>
                )}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => setEditorHtml(editorRef.current?.innerHTML || '')}
                  onBlur={() => setEditorHtml(editorRef.current?.innerHTML || '')}
                  className="min-h-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-relaxed text-slate-900 shadow-inner outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 [&>*]:my-2 [&>p]:my-3 [&>div]:my-2 [&>br]:my-1"
                />
              </div>
              <p className="text-xs text-slate-500">
                Drag & Drop für Bilder/PDF erlaubt; Platzhalter fügen Anrede, Gruß und Signatur automatisch ein.
              </p>
            </div>

            <div
              className="space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <div className="text-sm font-medium text-slate-800">Anhänge (Bilder/PDF)</div>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-slate-800 hover:file:bg-slate-100"
              />
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                  {attachments.map((a) => (
                    <span
                      key={a.id}
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200"
                    >
                      {a.name} ({Math.round(a.size / 1024)} KB)
                      <button
                        onClick={() => removeAttachment(a.id)}
                        className="text-rose-600 hover:text-rose-500"
                        aria-label={`${a.name} entfernen`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSend}
                disabled={status.state === 'sending' || selectedMembers.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {status.state === 'sending' ? 'Sende…' : 'Jetzt senden'}
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white">
                  {selectedMembers.length}
                </span>
              </button>
              <span className={`text-sm ${statusTone[status.state]}`}>
                {status.message || `Antwort-Adresse: ${senderEmail || 'deine Mail'}. Anrede & Gruß automatisch.`}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Preview</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Personalisierte Vorschau</h2>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>
                Person: {previewMember ? `${previewMember.firstName} ${previewMember.lastName}` : '—'}
              </div>
              <div className="text-[11px] text-slate-400">
                Empfänger mit Mail: {selectedMembers.filter((m) => m.email).length}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            {selectedMembers
              .filter((m) => m.email)
              .slice(0, 6)
              .map((m) => (
                <span key={m.id} className="rounded-full bg-slate-100 px-2 py-1 ring-1 ring-slate-200" title={m.email || ''}>
                  {m.firstName} {m.lastName}
                </span>
              ))}
            {selectedMembers.filter((m) => m.email).length > 6 && (
              <span className="rounded-full bg-slate-100 px-2 py-1 ring-1 ring-slate-200">
                +{selectedMembers.filter((m) => m.email).length - 6} weitere
              </span>
            )}
            {selectedMembers.filter((m) => m.email).length === 0 && (
              <span className="text-slate-500">Keine Empfänger ausgewählt.</span>
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
            {previewMember ? (
              (() => {
                const previewContent = personalizeMessage(previewMember);
                return (
                  <>
                    <div className="mb-3 flex flex-col gap-1 text-xs text-slate-500">
                      <span>
                        Absender: info@repair-leonberg.de · Antwort an: {senderEmail || 'deine Mail'}
                      </span>
                      <span>Geht an {selectedMembers.filter((m) => m.email).length} Empfänger · Vorschau 1 davon</span>
                      <span>Betreff: {subject}</span>
                    </div>
                    <div
                      className="space-y-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: previewContent.html }}
                    />
                  </>
                );
              })()
            ) : (
              <p className="text-slate-500">
                Wähle mindestens einen Empfänger mit E-Mail, um die Vorschau zu sehen.
              </p>
            )}
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Versand erfolgt einzeln pro Empfänger (kein Sammel-BCC). Automatische Platzhalter sorgen
            für korrekte Anrede, Grußformel und deine Signatur.
            {attachments.length > 0 && (
              <div className="mt-2 text-emerald-700">
                Anhänge: {attachments.length} Datei(en) werden mitgesendet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MailServiceApp;
