import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { getClientMeta } from '../../entities/appMeta/api';
import { getChampionship } from '../../entities/championships';
import { getAuthApiErrorMessage } from '../../entities/auth';
import { getNominations } from '../../entities/nominations';
import {
  useCreateWorkMutation,
  useCreateWorkWithAttachmentsMutation,
  useDeleteWorkAttachmentMutation,
  useDeleteWorkMutation,
  useMyWorkQuery,
  useSubmitWorkMutation,
  useUpdateWorkMutation,
  useUploadWorkAttachmentMutation,
  WorkAttachmentImage,
  type WorkFormValues,
} from '../../entities/works';
import { firstDefined } from '../../lib/firstDefined';
import {
  ErrorText,
  FooterLinks,
  Input,
  Label,
  Page,
  Subtitle,
  TextLink,
  Title,
} from '../../shared/ui';
import {
  ActionRow,
  AttachmentList,
  AttachmentRow,
  DangerAction,
  DescriptionArea,
  DraftFileList,
  DraftFileRow,
  FieldBlock,
  FileInput,
  FormCard,
  FormSubmit,
  HintBlock,
  Muted,
  MutedSmall,
  NominationSelect,
  PrimaryAction,
  Section,
  SectionLoose,
  StatusLine,
  TextButton,
  TextButtonLg,
  UploadPending,
} from './styles';
import { useSyncWorkFormFromWork } from './hooks/useSyncWorkFormFromWork';
import { parseWorkRouteIds } from './lib/parseWorkRouteIds';

export function WorkFormPage() {
  const route = useParams<{
    championshipId: string;
    workId: string;
  }>();
  const { championshipId, workId, isEdit } = parseWorkRouteIds(route);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newDraftFiles, setNewDraftFiles] = useState<File[]>([]);
  const [createFileError, setCreateFileError] = useState<string | null>(null);

  const clearCreateUi = useCallback(() => {
    setNewDraftFiles([]);
    setCreateFileError(null);
  }, []);

  const createMut = useCreateWorkMutation(championshipId, clearCreateUi);
  const createWithAttMut = useCreateWorkWithAttachmentsMutation(
    championshipId,
    clearCreateUi,
  );
  const updateMut = useUpdateWorkMutation(championshipId, workId);
  const submitMut = useSubmitWorkMutation(championshipId, workId);
  const deleteMut = useDeleteWorkMutation(championshipId, workId);
  const uploadMut = useUploadWorkAttachmentMutation(
    championshipId,
    workId,
    fileInputRef,
  );
  const deleteAttMut = useDeleteWorkAttachmentMutation(championshipId, workId);

  const { register, reset, handleSubmit, watch } = useForm<WorkFormValues>({
    defaultValues: { nominationId: '', title: '', description: '' },
  });

  const chQuery = useQuery({
    queryKey: ['championship', championshipId],
    queryFn: () => getChampionship(championshipId),
    enabled: Number.isFinite(championshipId),
  });
  const nomsQuery = useQuery({
    queryKey: ['nominations', championshipId],
    queryFn: () => getNominations(championshipId),
    enabled: Number.isFinite(championshipId),
  });
  const workQuery = useMyWorkQuery(championshipId, workId, isEdit);
  const metaQuery = useQuery({
    queryKey: ['clientMeta'],
    queryFn: getClientMeta,
    staleTime: 60_000,
  });

  useSyncWorkFormFromWork(workQuery.data, reset);

  const serverError = getAuthApiErrorMessage(
    firstDefined(
      createMut.error,
      createWithAttMut.error,
      updateMut.error,
      submitMut.error,
      deleteMut.error,
      uploadMut.error,
      deleteAttMut.error,
    ),
    'Операция с работой завершилась ошибкой.',
  );

  if (!Number.isFinite(championshipId)) {
    return (
      <Page>
        <FormCard>
          <Title>Некорректный адрес</Title>
        </FormCard>
      </Page>
    );
  }

  if (
    chQuery.isLoading ||
    nomsQuery.isLoading ||
    (isEdit && workQuery.isLoading)
  ) {
    return (
      <Page>
        <FormCard>
          <Title>Загрузка…</Title>
        </FormCard>
      </Page>
    );
  }

  if (chQuery.isError || nomsQuery.isError || (isEdit && workQuery.isError)) {
    return (
      <Page>
        <FormCard>
          <Title>Работа</Title>
          <ErrorText>Не удалось загрузить данные.</ErrorText>
          <FooterLinks>
            <TextLink to={`/championships/${championshipId}/works/my`}>
              К моим работам
            </TextLink>
          </FooterLinks>
        </FormCard>
      </Page>
    );
  }

  const isPending =
    createMut.isPending ||
    createWithAttMut.isPending ||
    updateMut.isPending ||
    submitMut.isPending ||
    deleteMut.isPending ||
    uploadMut.isPending ||
    deleteAttMut.isPending;

  const readOnly = isEdit && workQuery.data?.status !== 'DRAFT';
  const diskEnabled = metaQuery.data?.workPhotoUploadEnabled ?? false;
  const attachments = workQuery.data?.attachments ?? [];
  const needPhotoForSubmit = diskEnabled && attachments.length < 1;

  const onSubmit = (v: WorkFormValues) => {
    if (isEdit) {
      updateMut.mutate(v);
      return;
    }
    if (diskEnabled) {
      if (newDraftFiles.length < 1) {
        setCreateFileError(
          'Добавьте хотя бы одно изображение — черновик и фото создаются одним запросом.',
        );
        return;
      }
      setCreateFileError(null);
      createWithAttMut.mutate({ v, files: newDraftFiles });
      return;
    }
    setCreateFileError(null);
    createMut.mutate(v);
  };

  return (
    <Page>
      <FormCard>
        <Title>{isEdit ? 'Моя работа' : 'Новая работа'}</Title>
        <Subtitle>
          {isEdit
            ? 'Черновик: можно править текст и фото до отправки на судейство.'
            : diskEnabled
              ? 'Заполните данные, выберите изображения и создайте черновик: работа и файлы сохраняются одним запросом. До 10 файлов, до 12 МБ каждый.'
              : 'Заполните данные и создайте черновик. После создания можно отредактировать текст. Загрузка фотографий сейчас недоступна — при необходимости сообщите организатору чемпионата.'}
        </Subtitle>
        {serverError ? <ErrorText>{serverError}</ErrorText> : null}
        {createFileError ? <ErrorText>{createFileError}</ErrorText> : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="work-nomination">Номинация</Label>
            <NominationSelect
              id="work-nomination"
              disabled={isEdit || readOnly}
              {...register('nominationId', { required: true })}
            >
              <option value="">— выберите —</option>
              {(nomsQuery.data ?? []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </NominationSelect>
          </div>

          <FieldBlock>
            <Label htmlFor="work-title">Название работы</Label>
            <Input
              id="work-title"
              disabled={readOnly}
              {...register('title', { required: true })}
            />
          </FieldBlock>

          <FieldBlock>
            <Label htmlFor="work-description">Описание</Label>
            <DescriptionArea
              id="work-description"
              rows={5}
              disabled={readOnly}
              {...register('description')}
            />
          </FieldBlock>

          {!isEdit && diskEnabled ? (
            <Section>
              <Label htmlFor="new-work-photos">Фотографии работы</Label>
              <HintBlock>
                До <strong>10</strong> изображений (JPEG, PNG, WebP, GIF).
                Сохранение на Яндекс.Диск (OAuth).{' '}
                Если загрузка не удастся, черновик на сервере не будет создан.
              </HintBlock>
              <FileInput
                id="new-work-photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={isPending || newDraftFiles.length >= 10}
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (!picked.length) return;
                  setNewDraftFiles((prev) => [...prev, ...picked].slice(0, 10));
                  setCreateFileError(null);
                }}
              />
              {newDraftFiles.length > 0 ? (
                <DraftFileList>
                  {newDraftFiles.map((f, idx) => (
                    <DraftFileRow key={`${f.name}-${f.size}-${idx}`}>
                      <span>{f.name}</span>
                      <TextButton
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          setNewDraftFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        Убрать
                      </TextButton>
                    </DraftFileRow>
                  ))}
                </DraftFileList>
              ) : null}
            </Section>
          ) : null}

          {!readOnly ? (
            <FormSubmit
              type="submit"
              disabled={
                isPending ||
                !watch('nominationId') ||
                (!isEdit && diskEnabled && newDraftFiles.length < 1)
              }
            >
              {isPending
                ? 'Сохранение…'
                : isEdit
                  ? 'Сохранить текст'
                  : diskEnabled
                    ? 'Создать черновик с фото'
                    : 'Создать черновик'}
            </FormSubmit>
          ) : null}
        </form>

        {isEdit && !readOnly ? (
          <SectionLoose>
            <Label>Фотографии работы</Label>
            {!diskEnabled ? (
              <HintBlock>
                Загрузка файлов сейчас недоступна. Сообщите организатору
                чемпионата о проблеме с загрузкой материалов к работам. При этом
                вы можете отправить работу на судейство и без приложенных
                фотографий.
              </HintBlock>
            ) : (
              <HintBlock>
                До <strong>10</strong> изображений (JPEG, PNG, WebP, GIF), до 12
                МБ каждое. Файлы сохраняются на Яндекс.Диск (OAuth).{' '}
                Перед отправкой работы нужно хотя бы одно фото.
              </HintBlock>
            )}
            {diskEnabled ? (
              <>
                <FileInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={isPending || attachments.length >= 10}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadMut.mutate(f);
                  }}
                />
                {uploadMut.isPending ? (
                  <UploadPending>Загрузка…</UploadPending>
                ) : null}
              </>
            ) : null}
            {attachments.length > 0 ? (
              <AttachmentList>
                {attachments.map((a) => (
                  <AttachmentRow key={a.id}>
                    {Number.isFinite(workId) ? (
                      <WorkAttachmentImage
                        championshipId={championshipId}
                        workId={workId}
                        attachmentId={a.id}
                        alt={a.originalName}
                        style={{
                          maxWidth: 160,
                          maxHeight: 120,
                          borderRadius: 8,
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Muted>{a.originalName}</Muted>
                    )}
                    <MutedSmall>{a.originalName}</MutedSmall>
                    {!readOnly && diskEnabled ? (
                      <TextButtonLg
                        type="button"
                        disabled={isPending}
                        onClick={() => deleteAttMut.mutate(a.id)}
                      >
                        Удалить
                      </TextButtonLg>
                    ) : null}
                  </AttachmentRow>
                ))}
              </AttachmentList>
            ) : null}
          </SectionLoose>
        ) : null}

        {isEdit && !readOnly ? (
          <ActionRow>
            <PrimaryAction
              type="button"
              onClick={() => submitMut.mutate()}
              disabled={isPending || needPhotoForSubmit}
              title={
                needPhotoForSubmit
                  ? 'Добавьте хотя бы одно фото, чтобы отправить работу'
                  : undefined
              }
            >
              Отправить на судейство
            </PrimaryAction>
            <DangerAction
              type="button"
              onClick={() => deleteMut.mutate()}
              disabled={isPending}
            >
              Удалить черновик
            </DangerAction>
          </ActionRow>
        ) : null}

        {isEdit ? (
          <StatusLine>
            Статус: <strong>{workQuery.data?.status}</strong>
          </StatusLine>
        ) : null}

        <FooterLinks>
          <TextLink to={`/championships/${championshipId}/works/my`}>
            К моим работам
          </TextLink>
          <Link to="/championships">К чемпионатам</Link>
        </FooterLinks>
      </FormCard>
    </Page>
  );
}
