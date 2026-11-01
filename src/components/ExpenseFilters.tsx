import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import type { Member } from '@/store/trips';

export type ExpenseFilterState = {
  searchQuery: string;
  filterByPerson: string | null; // memberId
  filterByStatus: 'all' | 'paid' | 'partial' | 'unpaid';
};

type Props = {
  members: Member[];
  filters: ExpenseFilterState;
  onFiltersChange: (filters: ExpenseFilterState) => void;
  /** Optional: Highlight "My expenses" for this member */
  currentUserId?: string;
};

export function ExpenseFilters({ members, filters, onFiltersChange, currentUserId }: Props) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters =
    filters.searchQuery.length > 0 ||
    filters.filterByPerson !== null ||
    filters.filterByStatus !== 'all';

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      filterByPerson: null,
      filterByStatus: 'all',
    });
  };

  const toggleStatus = (status: 'all' | 'paid' | 'partial' | 'unpaid') => {
    onFiltersChange({ ...filters, filterByStatus: status });
  };

  const selectPerson = (memberId: string | null) => {
    onFiltersChange({ ...filters, filterByPerson: memberId });
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: c.fill, borderColor: c.separator }]}>
        <Ionicons name="search-outline" size={20} color={c.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder="Search expenses..."
          placeholderTextColor={c.textTertiary}
          value={filters.searchQuery}
          onChangeText={(text) => onFiltersChange({ ...filters, searchQuery: text })}
          returnKeyType="search"
        />
        {filters.searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onFiltersChange({ ...filters, searchQuery: '' })}>
            <Ionicons name="close-circle" size={20} color={c.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Toggle Button */}
      <TouchableOpacity
        style={[styles.filterToggle, { backgroundColor: hasActiveFilters ? c.accent : c.fill }]}
        onPress={() => setExpanded(!expanded)}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={hasActiveFilters ? c.accentInk : c.text}
        />
        <Text
          style={[
            styles.filterToggleText,
            { color: hasActiveFilters ? c.accentInk : c.text },
          ]}
        >
          Filters
        </Text>
        {hasActiveFilters && (
          <View style={[styles.badge, { backgroundColor: c.accentInk }]}>
            <Text style={[styles.badgeText, { color: c.accent }]}>
              {[
                filters.searchQuery.length > 0,
                filters.filterByPerson !== null,
                filters.filterByStatus !== 'all',
              ].filter(Boolean).length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded Filters */}
      {expanded && (
        <View style={[styles.filtersPanel, { backgroundColor: c.card, borderColor: c.separator }]}>
          {/* Status Filters */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {(['all', 'unpaid', 'partial', 'paid'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        filters.filterByStatus === status ? c.accent : c.fill,
                      borderColor: filters.filterByStatus === status ? c.accent : c.separator,
                    },
                  ]}
                  onPress={() => toggleStatus(status)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          filters.filterByStatus === status ? c.accentInk : c.text,
                      },
                    ]}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Person Filters */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Paid by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filters.filterByPerson === null ? c.accent : c.fill,
                    borderColor: filters.filterByPerson === null ? c.accent : c.separator,
                  },
                ]}
                onPress={() => selectPerson(null)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: filters.filterByPerson === null ? c.accentInk : c.text,
                    },
                  ]}
                >
                  Everyone
                </Text>
              </TouchableOpacity>
              {members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        filters.filterByPerson === member.id ? c.accent : c.fill,
                      borderColor:
                        filters.filterByPerson === member.id ? c.accent : c.separator,
                    },
                  ]}
                  onPress={() => selectPerson(member.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          filters.filterByPerson === member.id ? c.accentInk : c.text,
                      },
                    ]}
                  >
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quick Actions */}
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close-circle-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.clearButtonText, { color: c.textSecondary }]}>
                Clear all filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  filterToggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filtersPanel: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
