-- Umar Dental & Implant Center — database schema
-- Dates are stored as 'YYYY-MM-DD' text and times as 'HH:MM' text (clinic-local, Asia/Karachi)
-- so they never shift with server time zones. Money is whole PKR in integer columns.

create extension if not exists pgcrypto;

create table if not exists clinic_settings (
  id                   int primary key default 1 check (id = 1),
  clinic_name          text not null default 'UMAR DENTAL',
  clinic_subtitle      text not null default '& IMPLANT CENTER',
  tagline              text not null default 'CARE • COMFORT • CONFIDENCE',
  doctor_name          text not null default 'Dr. Umar Akhtar',
  doctor_qualification text not null default 'BDS, RDS (Implantology)',
  email                text not null default '',
  website              text not null default '',
  secondary_phone      text not null default '03070159040',
  hours                text not null default '3:00 PM – 9:00 PM',
  whatsapp_number      text not null default '03310009851',
  signature_data_url   text not null default ''
);

create table if not exists branches (
  code        text primary key,               -- 'Bahria' | 'PWD'
  name        text not null,                  -- 'BAHRIA BRANCH'
  address     text not null,
  phone       text not null,
  review_url  text not null default '',
  mr_prefix   text not null unique            -- 'UDC-B-' | 'UDC-P-'
);

create table if not exists users (
  id               serial primary key,
  username         text not null unique,
  full_name        text not null,
  role             text not null check (role in ('admin','doctor','receptionist')),
  branch           text references branches(code),   -- null = all branches
  password_hash    text not null,
  active           boolean not null default true,
  failed_attempts  int not null default 0,
  locked_until     timestamptz,
  calendar_token   text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_at       timestamptz not null default now(),
  check (role <> 'receptionist' or branch is not null)
);

create table if not exists patients (
  mr          text primary key,
  name        text not null,
  phone       text not null default '',
  phone_norm  text not null default '',
  age         int,
  gender      text,
  address     text not null default '',
  branch      text not null references branches(code),
  first_visit text not null,
  created_at  timestamptz not null default now()
);
create index if not exists patients_phone_norm_idx on patients (phone_norm);
create index if not exists patients_branch_idx on patients (branch);

create sequence if not exists mr_seq_bahria;
create sequence if not exists mr_seq_pwd;
create sequence if not exists invoice_seq;

create table if not exists opd_visits (
  id          serial primary key,
  legacy_id   text unique,
  date        text not null,
  mr          text not null references patients(mr),
  branch      text not null references branches(code),
  visit_type  text not null,
  procedure   text not null default '',
  historical  boolean not null default false,
  created_by  int references users(id),
  created_at  timestamptz not null default now()
);
create index if not exists opd_mr_idx on opd_visits (mr);
create index if not exists opd_date_idx on opd_visits (date);

create table if not exists rates (
  id      serial primary key,
  name    text not null unique,
  price   int not null,
  sort    int not null default 0,
  active  boolean not null default true
);

create table if not exists invoices (
  id              serial primary key,
  invoice_no      text not null unique,
  share_token     text not null unique default encode(gen_random_bytes(18), 'hex'),
  date            text not null,
  mr              text not null references patients(mr),
  branch          text not null references branches(code),
  total_charges   int not null,
  discount        int not null default 0,
  net             int not null,
  paid_cash       int not null default 0,
  paid_card       int not null default 0,
  payment_method  text check (payment_method in ('Cash','Card','Bank Transfer','Other')),
  remarks         text not null default '',
  summary         text not null default '',
  historical      boolean not null default false,
  created_by      int references users(id),
  created_at      timestamptz not null default now()
);
create index if not exists invoices_mr_idx on invoices (mr);
create index if not exists invoices_date_idx on invoices (date);

create table if not exists invoice_items (
  id          serial primary key,
  invoice_id  int not null references invoices(id) on delete cascade,
  sort        int not null default 0,
  procedure   text not null,
  tooth       text not null default '',
  qty         int not null default 1,
  rate        int not null default 0,
  amount      int not null default 0
);
create index if not exists invoice_items_invoice_idx on invoice_items (invoice_id);

create table if not exists appointments (
  id            serial primary key,
  share_token   text not null unique default encode(gen_random_bytes(18), 'hex'),
  mr            text not null references patients(mr),
  branch        text not null references branches(code),
  date          text not null,
  time          text not null,
  duration_min  int not null default 30,
  procedure     text not null default '',
  status        text not null default 'Booked'
                check (status in ('Booked','Confirmed','Arrived','Completed','Cancelled','No-show')),
  notes         text not null default '',
  created_by    int references users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists appointments_date_idx on appointments (date);

create table if not exists prescriptions (
  id              serial primary key,
  share_token     text not null unique default encode(gen_random_bytes(18), 'hex'),
  date            text not null,
  mr              text not null references patients(mr),
  branch          text not null references branches(code),
  diagnosis       text not null default '',
  treatment_done  text not null default '',   -- one item per line
  advice          text not null default '',   -- one item per line
  created_by      int references users(id),
  created_at      timestamptz not null default now()
);

create table if not exists prescription_items (
  id               serial primary key,
  prescription_id  int not null references prescriptions(id) on delete cascade,
  sort             int not null default 0,
  medicine         text not null,
  dose             text not null default '',
  instructions     text not null default '',
  days             text not null default ''
);

create table if not exists expenses (
  id           serial primary key,
  legacy_id    text unique,
  date         text not null,
  branch       text not null references branches(code),
  category     text not null default '',
  description  text not null default '',
  amount       int not null,
  historical   boolean not null default false,
  created_by   int references users(id),
  created_at   timestamptz not null default now()
);
