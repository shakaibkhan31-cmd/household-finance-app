import { supabase } from '@/lib/supabase';

/**
 * Automatically syncs credit card balance changes with the debts table.
 * @param cardName Name of the credit card account (e.g. 'HBL Credit Card')
 * @param amountChange Positive value to increase debt (expense), negative to decrease debt (payment)
 */
export async function syncCreditCardDebt(cardName: string, amountChange: number) {
  try {
    // 1. Check if a debt record already exists for this credit card
    const { data: existingDebts, error: fetchErr } = await supabase
      .from('debts')
      .select('*')
      .eq('type', 'Credit Card')
      .ilike('person_name', `%${cardName}%`)
      .limit(1);

    if (fetchErr) {
      console.error('Error fetching credit card debt:', fetchErr.message);
      return;
    }

    if (existingDebts && existingDebts.length > 0) {
      // 2. Update existing debt record
      const currentDebt = existingDebts[0];
      const newAmount = Math.max(0, Number(currentDebt.amount) + amountChange);
      const newStatus = newAmount === 0 ? 'Settled' : 'Active';

      await supabase
        .from('debts')
        .update({
          amount: newAmount,
          status: newStatus,
        })
        .eq('id', currentDebt.id);
    } else if (amountChange > 0) {
      // 3. If no record exists and a new expense occurred, create one automatically
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('debts').insert([
        {
          person_name: cardName,
          type: 'Credit Card',
          direction: 'Taken (Payable)',
          amount: amountChange,
          due_date: today,
          status: 'Active',
          notes: 'Auto-synced from card transactions',
        },
      ]);
    }
  } catch (err) {
    console.error('Failed to sync credit card debt:', err);
  }
}