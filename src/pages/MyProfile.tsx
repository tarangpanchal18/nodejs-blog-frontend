import { ChangeEvent, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';

const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await profileApi.getMyProfile();

      if (response.error) {
        toast.error(response.error);
        setIsLoading(false);
        return;
      }

      const profile = response.data!;
      setName(profile.name);
      setEmail(profile.email);
      setAvatarPreview(profile.avatar);
      updateUser(profile);
      setIsLoading(false);
    };

    loadProfile();
  }, [updateUser]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setAvatarFile(null);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(extension)) {
      toast.error('Only image files are allowed: jpg, jpeg, png, gif, webp, bmp');
      event.target.value = '';
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    const response = await profileApi.updateMyProfile({
      name: name.trim(),
      avatar: avatarFile,
    });

    if (response.error) {
      toast.error(response.error);
      setIsSaving(false);
      return;
    }

    const profile = response.data!;
    updateUser(profile);
    setName(profile.name);
    setEmail(profile.email);
    setAvatarPreview(profile.avatar);
    setAvatarFile(null);
    toast.success('Profile updated successfully');
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Update your display name and profile photo. Email is view-only.
          </p>

          {isLoading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading profile...</p>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="avatar">Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted ring-2 ring-background">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="h-full w-full rounded-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        {name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <Input
                    id="avatar"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled />
              </div>

              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
