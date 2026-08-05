-- Individuals can exchange a deliberately small set of content in the home
-- message drawer: text/HTTPS links, inspected documents and signature-checked
-- JPG, PNG or WebP pictures. Rich chat features remain blocked.
create or replace function profcaria.enforce_safe_job_chat()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.message_type not in ('text','file','image','system') then
    raise exception 'Profcaria chat accepts only text, links, checked documents and checked pictures.';
  end if;
  return new;
end;
$$;

create or replace function profcaria.enforce_scanned_attachment_release()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.attachment_type not in ('document','image') then
    raise exception 'Only documents and pictures are allowed in Profcaria chat.';
  end if;
  if new.scan_status <> 'passed' and new.released_at is not null then
    raise exception 'Attachments cannot be released before security inspection passes.';
  end if;
  return new;
end;
$$;

update storage.buckets
set public = false,
    file_size_limit = 8388608,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
where id = 'profcaria-documents';
