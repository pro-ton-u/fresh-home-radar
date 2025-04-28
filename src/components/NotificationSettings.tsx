
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useFoodInventory } from '@/contexts/FoodInventoryContext';
import { NotificationSettings as NotificationSettingsType } from '@/types';
import { requestNotificationPermission, areNotificationsSupported } from '@/services/notificationService';

interface NotificationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings = ({ isOpen, onClose }: NotificationSettingsDialogProps) => {
  const { notificationSettings, updateNotificationSettings } = useFoodInventory();
  const [settings, setSettings] = useState<NotificationSettingsType>({ ...notificationSettings });
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettings(settings);
    onClose();
  };

  const checkPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-toggle">Enable Notifications</Label>
              <Switch
                id="notifications-toggle"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>
            
            {!areNotificationsSupported() && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                Your browser doesn't support notifications. You'll see in-app notifications only.
              </div>
            )}
            
            {areNotificationsSupported() && !permissionStatus && (
              <Button type="button" variant="outline" onClick={checkPermission} className="w-full">
                Check Notification Permission
              </Button>
            )}
            
            {permissionStatus === 'denied' && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Notification permission denied. Please enable notifications in your browser settings.
              </div>
            )}
            
            {permissionStatus === 'granted' && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                Notification permission granted!
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="threshold">Notification Threshold (Days)</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                max="14"
                value={settings.threshold}
                onChange={(e) => setSettings({ ...settings, threshold: parseInt(e.target.value, 10) })}
              />
              <p className="text-xs text-gray-500">
                You'll be notified when items are {settings.threshold} days or less from expiring
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Settings</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettings;
