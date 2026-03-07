ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check
CHECK (
  type = ANY (
    ARRAY[
      'deposit'::text,
      'withdrawal'::text,
      'transfer_in'::text,
      'transfer_out'::text,
      'pdf_purchase'::text,
      'bonus'::text
    ]
  )
);