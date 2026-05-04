-- Set parent_id relationships for the default Saudi GAAP chart of accounts

-- Level 2 → Level 1
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1')  WHERE code = '11';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1')  WHERE code = '12';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '2')  WHERE code = '21';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '3')  WHERE code = '3101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '3')  WHERE code = '3102';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '3')  WHERE code = '3103';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '4')  WHERE code = '4101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5')  WHERE code = '5101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5')  WHERE code = '5201';

-- Level 3 → Level 2
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '11')   WHERE code = '1101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '11')   WHERE code = '1102';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '11')   WHERE code = '1103';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '12')   WHERE code = '1201';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '21')   WHERE code = '2101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '21')   WHERE code = '2102';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '21')   WHERE code = '2103';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '4101') WHERE code = '410101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '4101') WHERE code = '410102';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5201') WHERE code = '520101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5201') WHERE code = '520102';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5201') WHERE code = '520103';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5201') WHERE code = '520104';

-- Level 4 → Level 3
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1101') WHERE code = '110101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1101') WHERE code = '110102';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1102') WHERE code = '110201';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1201') WHERE code = '120101';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1201') WHERE code = '120102';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '2101') WHERE code = '210101';
