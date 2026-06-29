import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  CalendarDays,
  ExternalLink,
  FileText,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
  Unlink,
  X
} from 'lucide-react';
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

const defaultSubject = 'Einladung zum nächsten Repair Café';
const dutyRosterUrl =
  'https://docs.google.com/spreadsheets/d/1CUYP-AT9NLqx8E8tE7M7DDfJfvGjCUW-/edit?usp=sharing&ouid=112698322874253366185&rtpof=true&sd=true';

const defaultBody = `{{Anrede}},

wir treffen uns am Samstag, 14. März, zum nächsten Repair Café.

Um 9:00 Uhr beginnt unser Frühstück und um 10:00 Uhr startet das Repair Café.

Hier ist direkt der Link für den Dienstplan: [Dienstplan öffnen](${dutyRosterUrl})

{{Gruss}} {{Signatur}}`;

const renderMarkdown = (markdown: string) => marked.parse(markdown) as string;

const invitationTemplateHtml = () => renderMarkdown(defaultBody);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  return `https://${trimmed}`;
};

const chipColors = [
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-emerald-50 text-emerald-800 border-emerald-200',
  'bg-sky-50 text-sky-800 border-sky-200',
  'bg-indigo-50 text-indigo-800 border-indigo-200',
  'bg-pink-50 text-pink-800 border-pink-200',
  'bg-rose-50 text-rose-800 border-rose-200'
];

const STORAGE_KEY = 'mailservice_members_v1';
const LAST_MAIL_KEY = 'mailservice_last_mail_v2';

type Props = {
  apiUrl?: string;
  apiToken?: string;
};

type ApiMemberRow = {
  id?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  is_member?: boolean | null;
  tags?: string[] | null;
  greeting?: string | null;
  closing?: string | null;
  receives_mail?: boolean | null;
  receivesMail?: boolean | null;
  street?: string | null;
  city?: string | null;
  phone?: string | null;
  notes?: string | null;
};

const normalizeMember = (row: ApiMemberRow): Member => ({
  id: row.id ?? Math.random().toString(36).slice(2),
  firstName: row.first_name ?? row.firstName ?? '',
  lastName: row.last_name ?? row.lastName ?? '',
  email: row.email ?? undefined,
  isMember: row.is_member ?? true,
  tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
  greeting: row.greeting ?? '',
  closing: row.closing ?? '',
  receivesMail: row.receives_mail ?? row.receivesMail ?? true,
  street: row.street ?? '',
  city: row.city ?? '',
  phone: row.phone ?? '',
  notes: row.notes ?? '',
  personalNote: ''
});

type NewMemberDraft = Partial<Member>;

const createEmptyNewMember = (): NewMemberDraft => ({
  firstName: '',
  lastName: '',
  email: '',
  tags: [],
  greeting: '',
  closing: '',
  street: '',
  city: '',
  phone: '',
  notes: '',
  isMember: true,
  receivesMail: true
});

const MailServiceApp = ({ apiUrl = '/members/api/contacts', apiToken }: Props) => {
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
  const [senderChoice, setSenderChoice] = useState<string>(() => {
    const first = memberData.find((m) => m.email);
    return first ? first.id : '';
  });
  const [subject, setSubject] = useState(defaultSubject);
  const [editorHtml, setEditorHtml] = useState<string>(() => invitationTemplateHtml());
  const [status, setStatus] = useState<SendStatus>({ state: 'idle' });
  const [linkDialog, setLinkDialog] = useState({
    open: false,
    href: '',
    text: ''
  });
  const [linkStatus, setLinkStatus] = useState('');
  const [newMember, setNewMember] = useState<NewMemberDraft>(() => createEmptyNewMember());
  const [showAddForm, setShowAddForm] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const hasHydratedEditor = useRef(false);
  const isEditorEmpty = (html: string) =>
    html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        enableClickSelection: true,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        protocols: ['mailto', 'tel'],
        HTMLAttributes: {
          class: 'text-brand-700 underline underline-offset-2',
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      }),
      Placeholder.configure({
        placeholder:
          'Schreibe deine Nachricht. Links und Platzhalter kannst du oben einfügen.'
      })
    ],
    content: editorHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[260px] max-w-none rounded-2xl bg-slate-50 px-4 py-3 text-base leading-relaxed text-slate-900 outline-none [&>*]:my-2 [&>p]:my-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6'
      }
    },
    onUpdate: ({ editor }) => {
      setEditorHtml(editor.getHTML());
    }
  });

  // Persist members after changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    } catch (error) {
      console.warn('Konnte Mitgliederliste nicht speichern', error);
    }
  }, [members]);

  // Load members from Supabase API (fallback: localStorage -> bundled data)
  useEffect(() => {
    const loadMembers = async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

      // Try cached local copy first
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setMembers(parsed);
            }
          }
        } catch (error) {
          console.warn('Konnte Mitgliederliste nicht aus localStorage laden', error);
        }
      }

      setStatus({ state: 'sending', message: 'Lade Mitglieder…' });
      try {
        const res = await fetch(apiUrl, { headers });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data: ApiMemberRow[] = await res.json();
        const normalized = data.map((row) => normalizeMember(row));
        setMembers(normalized);
        setStatus({ state: 'idle', message: undefined });
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch (error) {
        console.error('Mitglieder konnten nicht geladen werden', error);
        setStatus({
          state: 'error',
          message: 'Konnte Mitglieder nicht laden. Zeige lokale Daten.'
        });
      }
    };

    loadMembers();
  }, [apiUrl, apiToken]);

  useEffect(() => {
    if (!editor || hasHydratedEditor.current) return;

    const defaultHtml = invitationTemplateHtml();
    let initialHtml = defaultHtml;
    let initialSubject = defaultSubject;

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(LAST_MAIL_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<{ subject: string; html: string }>;
          if (parsed.html) initialHtml = parsed.html;
          if (parsed.subject) initialSubject = parsed.subject;
        }
      } catch (error) {
        console.warn('Konnte letzte Mail nicht laden', error);
      }
    }

    hasHydratedEditor.current = true;
    setSubject(initialSubject);
    setEditorHtml(initialHtml);
    editor.commands.setContent(initialHtml, { emitUpdate: false });
  }, [editor]);

  useEffect(() => {
    if (!senderChoice) return;
    const m = members.find((mem) => mem.id === senderChoice);
    if (m) {
      setUser((prev) => ({
        ...prev,
        name: `${m.firstName} ${m.lastName}`,
        email: m.email || ''
      }));
    }
  }, [senderChoice, members]);

  const getSelectedText = () => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ').trim();
  };

  const openLinkDialog = () => {
    if (!editor) return;
    const selectedText = getSelectedText();
    const currentHref = editor.getAttributes('link').href as string | undefined;
    setLinkDialog({
      open: true,
      href: currentHref ?? '',
      text: selectedText
    });
    setLinkStatus('');
  };

  const closeLinkDialog = () => {
    setLinkDialog({ open: false, href: '', text: '' });
    setLinkStatus('');
  };

  const applyLink = () => {
    if (!editor) return;

    const href = normalizeUrl(linkDialog.href);
    if (!href) {
      setLinkStatus('Bitte eine Adresse eingeben.');
      return;
    }

    const selectedText = getSelectedText();
    const text = linkDialog.text.trim() || selectedText || href;
    const linkHtml = `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
    const command = editor.chain().focus();
    if (editor.isActive('link')) {
      command.extendMarkRange('link');
    }
    command.insertContent(linkHtml).run();
    closeLinkDialog();
  };

  const openEnteredLink = () => {
    const href = normalizeUrl(linkDialog.href);
    if (!href) {
      setLinkStatus('Bitte zuerst eine Adresse eingeben.');
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const insertDutyRosterLink = () => {
    if (!editor) return;
    const linkHtml = `<a href="${escapeHtml(dutyRosterUrl)}">Dienstplan öffnen</a>`;
    editor.chain().focus().insertContent(linkHtml).run();
    setStatus({ state: 'idle', message: 'Dienstplan-Link eingefügt.' });
  };

  const loadInvitationTemplate = () => {
    const html = invitationTemplateHtml();
    setSubject(defaultSubject);
    setEditorHtml(html);
    editor?.commands.setContent(html, { emitUpdate: false });
    setStatus({ state: 'idle', message: 'Einladungsvorlage geladen.' });
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

  const handleAddMember = async () => {
    if (!newMember.firstName || !newMember.lastName) {
      setStatus({ state: 'error', message: 'Bitte Vor- und Nachname ausfüllen.' });
      return;
    }

    const email = newMember.email?.trim() || undefined;
    const payload = {
      firstName: newMember.firstName.trim(),
      lastName: newMember.lastName.trim(),
      email,
      tags: (newMember.tags || []).map((tag) => tag.trim()).filter(Boolean),
      greeting: newMember.greeting || `Hallo ${newMember.firstName}`,
      closing: newMember.closing || 'Viele Grüße',
      isMember: newMember.isMember ?? true,
      receivesMail: Boolean(email) && newMember.receivesMail !== false,
      street: newMember.street?.trim() || undefined,
      city: newMember.city?.trim() || undefined,
      phone: newMember.phone?.trim() || undefined,
      notes: newMember.notes?.trim() || undefined
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

    setStatus({ state: 'sending', message: 'Mitglied wird gespeichert…' });

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`API antwortet mit ${res.status}`);
      }
      const data: ApiMemberRow = await res.json();
      const added = normalizeMember(data);
      if (payload.receivesMail && added.email) {
        setMembers((prev) => [...prev, added]);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.add(added.id);
          return next;
        });
      }
      setStatus({ state: 'success', message: 'Person in der Masterliste gespeichert.' });
      setNewMember(createEmptyNewMember());
      setShowAddForm(false);
    } catch (error) {
      console.error('Mitglied konnte nicht gespeichert werden', error);
      setStatus({ state: 'error', message: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' });
    }
  };

  const handleSend = async () => {
    const senderEmail = members.find((m) => m.id === senderChoice)?.email || '';

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

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            LAST_MAIL_KEY,
            JSON.stringify({ subject: trimmedSubject, html: editorHtml })
          );
        } catch (error) {
          console.warn('Letzte Mail konnte nicht gespeichert werden', error);
        }
      }

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

  const senderEmail = members.find((m) => m.id === senderChoice)?.email || '';
  const hasDutyRosterLink = editorHtml.includes(dutyRosterUrl);
  const toolbarButtonClass = (active = false) =>
    `inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${
      active
        ? 'bg-brand-600 text-white shadow-sm'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    } disabled:cursor-not-allowed disabled:opacity-50`;
  const commandButtonClass =
    'inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Absender</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Wer verschickt die Mail?</h2>
            <p className="text-sm text-slate-600">
              Wähle dich aus der Liste. Antworten landen bei dir.
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
              <option value="">Bitte wählen</option>
              {senderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.email})
                </option>
              ))}
            </select>
          </label>
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
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${selected ? 'ring-2 ring-brand-200 ring-offset-2 ring-offset-white' : ''
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
	                          onClick={async (e) => {
	                            e.stopPropagation();
	                            const confirmed = window.confirm(
	                              `Soll ${member.firstName} ${member.lastName} aus dem Mailservice archiviert werden?`
	                            );
	                            if (!confirmed) return;

                            const headers: Record<string, string> = {};
                            if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

                            try {
                              const res = await fetch(`${apiUrl}?id=${encodeURIComponent(member.id)}`, {
                                method: 'DELETE',
                                headers
                              });
                              if (!res.ok) {
                                throw new Error(`API ${res.status}`);
                              }
                              setMembers((prev) => prev.filter((m) => m.id !== member.id));
                              if (senderChoice === member.id) {
                                setSenderChoice('custom');
                              }
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                next.delete(member.id);
                                return next;
                              });
	                              setStatus({ state: 'success', message: 'Mitglied archiviert.' });
	                            } catch (error) {
	                              console.error('Mitglied konnte nicht archiviert werden', error);
	                              setStatus({
	                                state: 'error',
	                                message: 'Archivieren fehlgeschlagen. Bitte erneut versuchen.'
	                              });
	                            }
	                          }}
	                          className="text-xs font-semibold text-rose-600 hover:text-rose-500"
	                        >
	                          Archivieren
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
                    type="email"
                    value={newMember.email || ''}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="mail@beispiel.de"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Telefon</span>
                  <input
                    type="tel"
                    value={newMember.phone || ''}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Telefonnummer"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Straße</span>
                  <input
                    value={newMember.street || ''}
                    onChange={(e) => setNewMember({ ...newMember, street: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Straße und Hausnummer"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Ort</span>
                  <input
                    value={newMember.city || ''}
                    onChange={(e) => setNewMember({ ...newMember, city: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Ort"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Tags (kommagetrennt)</span>
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
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
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
              <div className="md:col-span-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Notiz</span>
                  <textarea
                    value={newMember.notes || ''}
                    onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                    rows={3}
                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Interne Notiz"
                  />
                </label>
              </div>
              <div className="md:col-span-2 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={newMember.isMember !== false}
                    onChange={(e) => setNewMember({ ...newMember, isMember: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
                  />
                  Mitglied
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!newMember.email?.trim()}
                    checked={Boolean(newMember.email?.trim()) && newMember.receivesMail !== false}
                    onChange={(e) => setNewMember({ ...newMember, receivesMail: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300 disabled:opacity-50"
                  />
                  Im Mailservice aktiv
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

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-slate-700">
                <button
                  type="button"
                  title="Fett"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={toolbarButtonClass(Boolean(editor?.isActive('bold')))}
                >
                  <Bold className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Kursiv"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={toolbarButtonClass(Boolean(editor?.isActive('italic')))}
                >
                  <Italic className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Unterstrichen"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={toolbarButtonClass(Boolean(editor?.isActive('underline')))}
                >
                  <UnderlineIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Aufzählung"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={toolbarButtonClass(Boolean(editor?.isActive('bulletList')))}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Nummerierte Liste"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={toolbarButtonClass(Boolean(editor?.isActive('orderedList')))}
                >
                  <ListOrdered className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Link einfügen oder bearbeiten"
                  disabled={!editor}
                  onClick={openLinkDialog}
                  className={toolbarButtonClass(Boolean(editor?.isActive('link')))}
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Link entfernen"
                  disabled={!editor || !editor.isActive('link')}
                  onClick={() => editor?.chain().focus().unsetLink().run()}
                  className={toolbarButtonClass(false)}
                >
                  <Unlink className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline-flex" />
                <button
                  type="button"
                  disabled={!editor}
                  onClick={loadInvitationTemplate}
                  className={commandButtonClass}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Vorlage laden
                </button>
                <button
                  type="button"
                  disabled={!editor}
                  onClick={insertDutyRosterLink}
                  className={commandButtonClass}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Dienstplan-Link
                </button>
                <button
                  type="button"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().insertContent('{{Anrede}}').run()}
                  className={commandButtonClass}
                >
                  {'{{Anrede}}'}
                </button>
                <button
                  type="button"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().insertContent('{{Gruss}}').run()}
                  className={commandButtonClass}
                >
                  {'{{Gruss}}'}
                </button>
                <button
                  type="button"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().insertContent('{{Signatur}}').run()}
                  className={commandButtonClass}
                >
                  {'{{Signatur}}'}
                </button>
              </div>

              {linkDialog.open && (
                <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Link einfügen</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Text eingeben, Adresse einfügen und übernehmen. Adressen ohne https werden automatisch ergänzt.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeLinkDialog}
                      className="rounded-lg p-1 text-slate-500 transition hover:bg-white hover:text-slate-900"
                      title="Schließen"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[0.9fr_1.2fr_auto]">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Anzeigetext
                      </span>
                      <input
                        value={linkDialog.text}
                        onChange={(e) => setLinkDialog((prev) => ({ ...prev, text: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                        placeholder="z.B. Dienstplan öffnen"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Adresse
                      </span>
                      <input
                        value={linkDialog.href}
                        onChange={(e) => {
                          setLinkDialog((prev) => ({ ...prev, href: e.target.value }));
                          setLinkStatus('');
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                        placeholder="https://..."
                      />
                    </label>
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={openEnteredLink}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        title="Link prüfen"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={applyLink}
                        className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                      >
                        Übernehmen
                      </button>
                    </div>
                  </div>
                  {linkStatus && <p className="mt-2 text-xs font-medium text-rose-600">{linkStatus}</p>}
                </div>
              )}

              <div className="relative rounded-2xl border border-slate-200 bg-slate-50 shadow-inner focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
                {isEditorEmpty(editorHtml) && (
                  <div className="pointer-events-none absolute inset-x-4 top-3 text-sm text-slate-400">
                    Schreibe deine Nachricht. Links, Vorlage und Dienstplan kannst du oben einfügen.
                  </div>
                )}
                <EditorContent editor={editor} />
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>
                  URLs werden beim Einfügen automatisch verlinkt. Platzhalter setzen Anrede, Gruß und Signatur automatisch.
                </span>
                {!hasDutyRosterLink && (
                  <span className="font-medium text-amber-700">
                    Kein Dienstplan-Link in der Nachricht.
                  </span>
                )}
              </div>
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
