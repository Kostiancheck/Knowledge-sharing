CREATE TABLE public.customers(
                                 id SERIAL PRIMARY KEY,
                                 name TEXT,
                                 email TEXT
);

ALTER TABLE public.customers REPLICA IDENTITY FULL;

INSERT INTO public.customers(name,email)
VALUES ('Grace Hopper 3','grace@navy3.mil');

UPDATE public.customers
SET email = 'admiral4@gmail.com'
WHERE name = 'Grace Hopper 3';

ALTER TABLE public.customers
    ADD COLUMN surname VARCHAR(20);

INSERT INTO public.customers (name, email, phone)
VALUES ('Alan Turing', 'alan@bletchley.uk', '+44 1234 567890');

DELETE FROM public.customers WHERE name = 'Grace Hopper 2';

SELECT * FROM public.customers;

SELECT current_database();

SELECT slot_name, active FROM pg_replication_slots;

SELECT pg_drop_replication_slot('debezium');

