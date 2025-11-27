import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactsScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('contacts');
      setContacts(raw ? JSON.parse(raw) : []);
    })();
  }, []);

  async function addContact() {
    if (!phone) return Alert.alert('Phone required');
    const next = [...contacts, { name: name || 'Contact', phone }];
    setContacts(next);
    await AsyncStorage.setItem('contacts', JSON.stringify(next));
    setName(''); setPhone('');
  }

  async function removeContact(index: number) {
    const copy = contacts.slice();
    copy.splice(index, 1);
    setContacts(copy);
    await AsyncStorage.setItem('contacts', JSON.stringify(copy));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <TextInput style={styles.input} placeholder="Name (optional)" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone (include country code)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TouchableOpacity style={styles.addBtn} onPress={addContact}>
        <Text style={{ color: 'white' }}>Add Contact</Text>
      </TouchableOpacity>

      <FlatList
        data={contacts}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: '#444' }}>{item.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => removeContact(index)}>
              <Text style={{ color: '#e53935' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ marginTop: 18, width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, marginTop: 8 },
  addBtn: { marginTop: 10, backgroundColor: '#0b7', padding: 10, alignItems: 'center', borderRadius: 6 },
  row: { padding: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' }
});
