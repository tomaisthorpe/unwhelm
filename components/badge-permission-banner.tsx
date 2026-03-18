"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, Bell, X } from 'lucide-react';
import { BadgePermissionState } from '@/lib/badge-utils';

interface BadgePermissionBannerProps {
  permissionState: BadgePermissionState;
  onRequestPermission: () => Promise<BadgePermissionState>;
  taskCount: number;
}

export function BadgePermissionBanner({ 
  permissionState, 
  onRequestPermission, 
  taskCount 
}: BadgePermissionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Don't show banner if permission is already granted, unsupported, or dismissed
  if (permissionState !== 'prompt' || isDismissed || taskCount === 0) {
    return null;
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await onRequestPermission();
      if (result === 'granted' || result === 'denied') {
        setIsDismissed(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Badge className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Enable Task Badges
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Show the number of due tasks ({taskCount}) on your home screen icon. 
              This helps you stay on top of your tasks even when the app is closed.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Bell className="h-4 w-4 mr-2" />
                {isRequesting ? 'Requesting...' : 'Enable Badges'}
              </Button>
              <Button
                onClick={() => setIsDismissed(true)}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Not now
              </Button>
            </div>
          </div>
          <Button
            onClick={() => setIsDismissed(true)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0 text-blue-400 hover:text-blue-600 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}