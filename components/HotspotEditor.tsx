
import React from 'react';
import { Hotspot, HotspotStatus, View, Unit, UnitStatus, ProjectAsset } from '../types';
import { Icons } from './Icons';

interface HotspotEditorProps {
  hotspot: Hotspot;
  onUpdate: (updatedHotspot: Hotspot) => void;
  onDelete: () => void;
  availableViews: View[];
  availableUnits: Unit[];
  projectAssets: ProjectAsset[];
  allViewHotspots: Hotspot[];
  currentViewId: string;
}

const unitStatusToHotspotStatus = (unitStatus: UnitStatus): HotspotStatus => {
  return unitStatus as unknown as HotspotStatus;
};

const STATUS_COLORS = {
  [UnitStatus.ForSale]: '#5C7263',
  [UnitStatus.Reserved]: '#FBBF24', // Tailwind amber-400
  [UnitStatus.Sold]: '#EF4444',     // Tailwind red-500
  [UnitStatus.Forthcoming]: '#9CA3AF', // Tailwind gray-400
};


export const HotspotEditor: React.FC<HotspotEditorProps> = ({ hotspot, onUpdate, onDelete, availableViews, availableUnits, projectAssets, allViewHotspots, currentViewId }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...hotspot, [name]: name === 'opacity' ? parseFloat(value) : value });
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLSelectElement>, type: 'view' | 'unit' | 'asset') => {
    const { value } = e.target;
    if (type === 'view') {
      onUpdate({ ...hotspot, linkedViewId: value || undefined, linkedUnitId: undefined, linkedAssetId: undefined });
    } else if (type === 'asset') {
      onUpdate({ ...hotspot, linkedAssetId: value || undefined, linkedViewId: undefined, linkedUnitId: undefined });
    } else {
      const selectedUnit = availableUnits.find(u => u.id === value);
      if (selectedUnit) {
        onUpdate({
          ...hotspot,
          linkedUnitId: value,
          linkedViewId: undefined,
          linkedAssetId: undefined,
          label: selectedUnit.name,
          status: unitStatusToHotspotStatus(selectedUnit.status),
          color: STATUS_COLORS[selectedUnit.status],
        });
      } else {
        onUpdate({ ...hotspot, linkedUnitId: undefined });
      }
    }
  };

  const handleLinkedHotspotChange = (targetHotspotId: string, isChecked: boolean) => {
    const currentLinkedIds = hotspot.linkedHotspotIds || [];
    const newLinkedIds = isChecked
      ? [...currentLinkedIds, targetHotspotId]
      : currentLinkedIds.filter(id => id !== targetHotspotId);
    onUpdate({ ...hotspot, linkedHotspotIds: newLinkedIds });
  };

  const linkableViews = availableViews.filter(v => v.id !== currentViewId);
  const isLinkedToUnit = !!hotspot.linkedUnitId;

  const linkedUnitIdsOnThisView = allViewHotspots
    .map(h => h.linkedUnitId)
    .filter((id): id is string => !!id);

  const linkablePolygonHotspots = allViewHotspots.filter(h => h.type === 'polygon' && h.id !== hotspot.id);

  return (
    <div className="space-y-4 text-gray-900 dark:text-gray-100">
      <h3 className="font-semibold text-lg text-[#2E2E2E] dark:text-white">Redigera område</h3>

      {hotspot.type === 'polygon' && (
        <div className="space-y-1">
          <label htmlFor="linkedUnitId" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Kopplad bostad</label>
          <select
            id="linkedUnitId"
            name="linkedUnitId"
            value={hotspot.linkedUnitId || ''}
            onChange={(e) => handleLinkChange(e, 'unit')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263] transition"
          >
            <option value="">Ingen koppling</option>
            {availableUnits.map(unit => {
              const isLinkedElsewhere = linkedUnitIdsOnThisView.includes(unit.id) && unit.id !== hotspot.linkedUnitId;
              return (
                <option key={unit.id} value={unit.id} disabled={isLinkedElsewhere}>
                  {unit.name} {isLinkedElsewhere && '(redan kopplad)'}
                </option>
              );
            })}
          </select>
        </div>
      )}


      <div className="space-y-1">
        <label htmlFor="label" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Etikett</label>
        <input
          type="text"
          id="label"
          name="label"
          value={hotspot.label}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263] transition disabled:bg-gray-100 dark:disabled:bg-gray-800"
          disabled={isLinkedToUnit && hotspot.type === 'polygon'}
        />
        {isLinkedToUnit && hotspot.type === 'polygon' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Etiketten synkas från den kopplade bostaden.</p>}
      </div>

      {hotspot.type === 'polygon' && (
        <>
          <div className="space-y-1">
            <label htmlFor="status" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select
              id="status"
              name="status"
              value={hotspot.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263] transition disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isLinkedToUnit}
            >
              <option value={HotspotStatus.ForSale}>Till salu</option>
              <option value={HotspotStatus.Reserved}>Reserverad</option>
              <option value={HotspotStatus.Sold}>Såld</option>
              <option value={HotspotStatus.Forthcoming}>Kommande</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 space-y-1">
              <label htmlFor="color" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Färg</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: hotspot.color }}></span>
                </span>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={hotspot.color}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263] transition disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  disabled={isLinkedToUnit}
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-baseline">
                <label htmlFor="opacity" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Opacitet</label>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{Math.round(hotspot.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                id="opacity"
                name="opacity"
                min="0"
                max="1"
                step="0.1"
                value={hotspot.opacity}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-1">
        <label htmlFor="linkedViewId" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Navigera till vy</label>
        <select
          id="linkedViewId"
          name="linkedViewId"
          value={hotspot.linkedViewId || ''}
          onChange={(e) => handleLinkChange(e, 'view')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263] transition"
          disabled={!!hotspot.linkedAssetId}
        >
          <option value="">Ingen vy</option>
          {linkableViews.map(view => (
            <option key={view.id} value={view.id}>{view.title}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="linkedAssetId" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Öppna mediefil</label>
        <select
          id="linkedAssetId"
          name="linkedAssetId"
          value={hotspot.linkedAssetId || ''}
          onChange={(e) => handleLinkChange(e, 'asset')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263] transition"
          disabled={!!hotspot.linkedViewId}
        >
          <option value="">Ingen fil</option>
          {projectAssets.map(asset => (
            <option key={asset.id} value={asset.id}>
              {asset.type === 'panorama' ? '360° ' : ''}{asset.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">Öppnar vald media i ett popup-fönster.</p>
      </div>

      {hotspot.type === 'camera' && (
        <div className="space-y-2 pt-4 border-t dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Synliga områden</label>
          <p className="text-xs text-gray-500 dark:text-gray-400">Välj vilka områden som är synliga från denna kamerapunkt. De kommer att highlightas vid hovring.</p>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
            {linkablePolygonHotspots.length > 0 ? linkablePolygonHotspots.map(polyHotspot => (
              <label key={polyHotspot.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hotspot.linkedHotspotIds?.includes(polyHotspot.id) || false}
                  onChange={(e) => handleLinkedHotspotChange(polyHotspot.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#5C7263] focus:ring-[#5C7263]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">{polyHotspot.label}</span>
              </label>
            )) : (
              <p className="text-xs text-gray-500 text-center py-2">Inga ytor i denna vy att koppla till.</p>
            )}
          </div>
        </div>
      )}

      <div className="border-t dark:border-gray-700 pt-4 mt-4">
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition"
        >
          <Icons.Trash className="w-4 h-4" />
          Radera område
        </button>
      </div>
    </div>
  );
};
